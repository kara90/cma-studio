/**
 * app/api/generate/route.ts — SERVERLESS EDGE INTERCEPTOR
 * ─────────────────────────────────────────────────────────────────────────
 * Flow: verifyAccess (auth) → rate limit → zod validate → pick hardware
 * (Auto-Director or the user's selection) → compile the protected prompt →
 * resolve the chosen model's Fal endpoint → hand off under the user's BYOK key.
 * The compiled prompt + injection logic never appear in any response.
 */
import { z } from 'zod';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifyAccess } from '@/lib/authGuard';
import { softRateLimit } from '@/lib/rateLimit';
import { compileProductionPrompt } from '@/lib/promptCompiler';
import { autoDirect } from '@/lib/autoDirector';
import { queueSubmitUrl, falAuthHeader } from '@/lib/falConfig';
import { getModelEndpoint } from '@/lib/modelEndpoints';
import { getModelCaps } from '@/lib/modelCaps';
import { getCamera, getLens } from '@/lib/vcpMatrix';
import { findAnamorphic, resolveLighting } from '@/lib/vcpManifest';

// Runs in the Cloudflare Workers node-compat runtime via OpenNext (no 'edge' export).
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function bad(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

const BodySchema = z.object({
  prompt: z.string().trim().min(1, 'A scene prompt is required.').max(2000),
  model: z.string().min(1, 'Pick a model.'),
  auto: z.boolean().optional(),
  /**
   * DIRECT mode — the plain generator pages (/video /image /audio): the user's
   * own prompt goes to the model as written, no studio recipe, exactly like
   * prompting fal directly but with our validated per-model format params.
   */
  direct: z.boolean().optional(),
  variant: z.coerce.number().int().min(0).max(999).optional(),
  cameraKey: z.string().optional(),
  lensKey: z.string().optional(),
  focalLength: z.coerce.number().finite().optional(),
  aperture: z.coerce.number().finite().optional(),
  isoValue: z.coerce.number().finite().optional(),
  cineNoise: z.coerce.number().finite().optional(),
  shutterAngle: z.coerce.number().finite().optional(),
  genreStyle: z.enum(['neutral', 'horror', 'drama', 'action-high-motion']).optional(),
  style: z.enum(['cinematic', 'commercial', 'vintage', 'noir']).optional(),
  shotSize: z.enum(['wide', 'full', 'medium', 'close', 'extreme-close']).optional(),
  cameraMove: z.enum(['static', 'push-in', 'tracking', 'pan', 'tilt', 'crane', 'handheld']).optional(),
  grade: z.enum(['neutral', 'warm', 'cool', 'teal-orange', 'bleach', 'mono']).optional(),
  speed: z.enum(['normal', 'slow-motion', 'speed-ramp', 'timelapse']).optional(),
  /** sound on/off for models with a generate_audio switch */
  sound: z.boolean().optional(),
  /** start/end frames (https URL or data URI) — flips video models to image-to-video */
  startImage: z.string().max(14_000_000).regex(/^(https:\/\/|data:image\/)/, 'Invalid start image.').optional(),
  endImage: z.string().max(14_000_000).regex(/^(https:\/\/|data:image\/)/, 'Invalid end image.').optional(),
  negativePrompt: z.string().trim().max(1000).optional(),
  resolution: z.string().max(20).optional(),
  duration: z.string().max(10).optional(),
  aspect: z.string().max(10).optional(),
  seed: z.coerce.number().int().min(0).max(4294967295).optional(),
  anamorphic: z.string().optional(),
  flare: z.enum(['blue', 'gold']).optional(),
  userApiKey: z.string().trim().min(8, 'Missing Fal.ai API key.').max(200),
});

export async function POST(request: Request) {
  const access = await verifyAccess();
  if (!access.ok) return bad(access.status, access.error);

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anon';
  // L1 — cheap in-isolate soft limit (also the fallback if the CF binding is absent,
  // e.g. plain `next dev`).
  if (!softRateLimit(`gen:${access.userId}:${ip}`, 12, 60_000)) {
    return bad(429, 'Too many renders in a short window. Give it a minute.');
  }
  // L2 — Cloudflare-native rate limit: coordinates the 12/min budget across isolates
  // within a location (the in-memory soft limit above cannot, since each isolate has
  // its own memory). Keyed per user. Fails open to L1 if the binding is unavailable.
  try {
    const limiter = getCloudflareContext().env.RENDER_LIMITER;
    if (limiter) {
      const { success } = await limiter.limit({ key: `gen:${access.userId}` });
      if (!success) return bad(429, 'Too many renders in a short window. Give it a minute.');
    }
  } catch {
    /* binding not wired in this environment — L1 soft limit already applied */
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Invalid request.') : 'Malformed JSON body.';
    return bad(400, msg);
  }

  // Resolve the chosen model's endpoint.
  const endpoint = getModelEndpoint(body.model);
  if (!endpoint) return bad(400, 'Unknown model.');

  // ── RAW PATH ── audio models always, and DIRECT mode for any model (the
  // plain /video /image /audio generator pages). The user's own prompt goes to
  // the model exactly as written: the protected DP compiler is bypassed in both
  // directions — nothing proprietary added, nothing of the user's intent bent.
  if (endpoint.output === 'audio' || body.direct === true) {
    const audioCaps = getModelCaps(body.model);
    const audioBody: Record<string, unknown> = endpoint.buildBody(body.prompt);

    // START/END FRAMES — flip to the model's image-to-video (or edit) variant.
    // Slugs + exact param names are schema-verified per model in modelEndpoints.
    let submitSlug = endpoint.slug;
    let skipAspect = false;
    if (body.startImage && endpoint.i2v) {
      const v = endpoint.i2v;
      skipAspect = Boolean(v.noAspect);
      if (body.endImage && v.firstLast) {
        submitSlug = v.firstLast.slug;
        audioBody[v.firstLast.firstParam] = body.startImage;
        audioBody[v.firstLast.lastParam] = body.endImage;
      } else {
        submitSlug = v.slug;
        audioBody[v.imageParam] = v.imageIsArray ? [body.startImage] : body.startImage;
        if (body.endImage && v.endImageParam) audioBody[v.endImageParam] = body.endImage;
      }
    }

    if (!skipAspect && audioCaps.aspectParam && audioCaps.aspects.length) {
      const a = body.aspect && audioCaps.aspects.includes(body.aspect) ? body.aspect : audioCaps.aspectDefault;
      if (a) audioBody[audioCaps.aspectParam] = a;
    }
    if (audioCaps.resolutionParam && audioCaps.resolutions.length) {
      const r = body.resolution && audioCaps.resolutions.includes(body.resolution) ? body.resolution : audioCaps.resolutionDefault;
      if (r) audioBody[audioCaps.resolutionParam] = r;
    }
    if (audioCaps.durationParam) {
      // free numeric window (Stable Audio 1-190s, ACE-Step 5-240s): clamp to the
      // schema's real bounds; enum models validate against the exact stop list.
      if (audioCaps.durationRange && body.duration && /^\d+$/.test(body.duration)) {
        const n = Math.min(audioCaps.durationRange.max, Math.max(audioCaps.durationRange.min, Number(body.duration)));
        audioBody[audioCaps.durationParam] = n;
      } else if (audioCaps.durations.length) {
        const d = body.duration && audioCaps.durations.includes(body.duration) ? body.duration : audioCaps.durationDefault;
        if (d && d !== 'auto') audioBody[audioCaps.durationParam] = audioCaps.durationNumeric ? Number(d) : d;
      }
    }
    if (audioCaps.supportsNegativePrompt && body.negativePrompt) audioBody.negative_prompt = body.negativePrompt;
    if (audioCaps.supportsSeed && typeof body.seed === 'number' && Number.isFinite(body.seed)) {
      audioBody.seed = Math.trunc(body.seed);
    }
    if (audioCaps.safetyTolerance) audioBody.safety_tolerance = audioCaps.safetyTolerance;
    // Sound on/off — ALWAYS sent explicitly where supported so cost is predictable.
    if (audioCaps.audioParam) {
      audioBody[audioCaps.audioParam] = typeof body.sound === 'boolean' ? body.sound : audioCaps.audioDefault;
    }
    try {
      const falRes = await fetch(queueSubmitUrl(submitSlug), {
        method: 'POST',
        headers: { Authorization: falAuthHeader(body.userApiKey), 'Content-Type': 'application/json' },
        body: JSON.stringify(audioBody),
      });
      if (!falRes.ok) {
        if (falRes.status === 401 || falRes.status === 403) {
          return bad(401, 'Fal.ai rejected your API key. Check the token in your vault.');
        }
        if (falRes.status === 404) {
          return bad(502, 'This model is not available on your Fal account yet (beta). Try another model.');
        }
        return bad(502, `Render service error (${falRes.status}). Try again.`);
      }
      const queued = (await falRes.json()) as { request_id?: string; status?: string };
      if (!queued.request_id) return bad(502, 'Render service did not return a tracking token.');
      return Response.json(
        {
          ok: true,
          trackingToken: queued.request_id,
          status: queued.status ?? 'IN_QUEUE',
          model: body.model,
          output: endpoint.output,
          // audio uses no camera package — the summary reflects that honestly
          summary: {
            model: body.model,
            camera: 'Not used', lens: 'Not used',
            focalLength: 0, aperture: 0, iso: 0, grain: 0,
            genre: 'neutral', style: 'cinematic',
            auto: false,
          },
        },
        { headers: NO_STORE },
      );
    } catch {
      return bad(504, 'Could not reach the render service. Try again.');
    }
  }

  // Choose the camera package: Auto-Director, or the user's own selection.
  const auto = Boolean(body.auto);
  const hw = auto
    ? { ...autoDirect(body.prompt, body.variant ?? 0), autoAngle: '' as string }
    : {
        cameraKey: body.cameraKey ?? '',
        lensKey: body.lensKey ?? '',
        focalLength: body.focalLength ?? 50,
        aperture: body.aperture ?? 2.8,
        isoValue: body.isoValue ?? 800,
        cineNoise: body.cineNoise ?? 0,
        shutterAngle: body.shutterAngle ?? 180,
        genreStyle: body.genreStyle ?? 'neutral',
        style: body.style ?? 'cinematic',
        angle: '',
      };

  // Easy (Auto) mode still exposes Style + Lighting — honour the user's picks
  // over Auto-Director's, while it chooses the rest of the camera package.
  if (auto) {
    if (body.style) hw.style = body.style;
    if (body.genreStyle) hw.genreStyle = body.genreStyle;
  }

  // One style of video: a raw payload can pair a style with a lighting mood
  // that contradicts it (the UI locks those tiles) — coerce to the style's
  // home mood so the compiled prompt never fights itself.
  hw.genreStyle = resolveLighting(hw.style, hw.genreStyle);

  if (!getCamera(hw.cameraKey)) return bad(400, auto ? 'Auto-Director failed.' : 'Invalid cameraKey.');
  if (!getLens(hw.lensKey)) return bad(400, auto ? 'Auto-Director failed.' : 'Invalid lensKey.');

  let compiled;
  try {
    compiled = compileProductionPrompt({
      prompt: body.prompt,
      autoAngle: auto ? hw.angle : undefined,
      cameraKey: hw.cameraKey,
      lensKey: hw.lensKey,
      focalLength: hw.focalLength,
      aperture: hw.aperture,
      isoValue: clamp(hw.isoValue, 100, 6400),
      cineNoise: clamp(hw.cineNoise, 0, 100),
      shutterAngle: clamp(hw.shutterAngle, 45, 360),
      genreStyle: hw.genreStyle,
      style: hw.style,
      // Manual only — in Auto the shot angle already carries framing/movement.
      shotSize: auto ? undefined : body.shotSize,
      cameraMove: auto ? undefined : body.cameraMove,
      grade: auto ? undefined : body.grade,
      speed: auto ? undefined : body.speed,
    });
  } catch (e) {
    return bad(400, e instanceof Error ? e.message : 'Prompt compilation failed.');
  }

  // Anamorphic: explicit control (manual) wins; else derive from the lens.
  const ana = body.anamorphic ? findAnamorphic(body.anamorphic) : undefined;
  const isAnamorphic = ana ? ana.id !== 'none' : compiled.lens.geometry === 'anamorphic';
  // Never send 21:9 — Fal video models reject it. Everything renders 16:9; the
  // anamorphic scope lives in the prompt text + the client letterbox preview.
  const aspectRatio = ana ? ana.falAspect : '16:9';
  // Flare colour tweak — only meaningful with a squeeze active. Warm gold vs cool blue.
  const flareNote = isAnamorphic
    ? body.flare === 'gold'
      ? ' Warm golden horizontal anamorphic lens flares.'
      : body.flare === 'blue'
        ? ' Cool blue horizontal anamorphic lens flares.'
        : ''
    : '';
  const submitPrompt =
    ana && ana.id !== 'none'
      ? `${compiled.prompt} Composed for a ${ana.squeeze}× anamorphic ${ana.label.split('· ')[1] ?? ''} scope.${flareNote}`
      : `${compiled.prompt}${flareNote}`;

  // Per-model output format: only ever send resolution/duration/negative_prompt
  // values this model actually accepts (validated against lib/modelCaps) so a
  // user's pick can never 422 the render.
  const caps = getModelCaps(body.model);
  const falBody: Record<string, unknown> = endpoint.buildBody(submitPrompt);
  // Aspect: an explicit user choice wins; else the anamorphic-derived aspect.
  if (caps.aspectParam && caps.aspects.length) {
    const a =
      body.aspect && caps.aspects.includes(body.aspect) ? body.aspect
        : caps.aspects.includes(aspectRatio) ? aspectRatio
          : caps.aspectDefault;
    if (a) falBody[caps.aspectParam] = a;
  }
  if (caps.resolutionParam && caps.resolutions.length) {
    const r = body.resolution && caps.resolutions.includes(body.resolution) ? body.resolution : caps.resolutionDefault;
    if (r) falBody[caps.resolutionParam] = r;
  }
  if (caps.durationParam) {
    if (caps.durationRange && body.duration && /^\d+$/.test(body.duration)) {
      // free numeric window — clamp to the schema's real bounds
      const n = Math.min(caps.durationRange.max, Math.max(caps.durationRange.min, Number(body.duration)));
      falBody[caps.durationParam] = n;
    } else if (caps.durations.length) {
      const d = body.duration && caps.durations.includes(body.duration) ? body.duration : caps.durationDefault;
      // 'auto' → omit, let the model choose. Numeric-schema params get a real number.
      if (d && d !== 'auto') falBody[caps.durationParam] = caps.durationNumeric ? Number(d) : d;
    }
  }
  if (caps.supportsNegativePrompt && body.negativePrompt) {
    falBody.negative_prompt = body.negativePrompt;
  }
  if (caps.supportsSeed && typeof body.seed === 'number' && Number.isFinite(body.seed)) {
    falBody.seed = Math.trunc(body.seed);
  }
  // safety_tolerance — only the 3 models whose live schema accepts it (veo-3-1,
  // nano-banana-pro, nano-banana-2) carry a value; "6" is fal's most permissive
  // level, to reduce false-positive content blocks on legitimate cinematic
  // scenes. Any other model leaves caps.safetyTolerance undefined and we send
  // nothing, so this can never 422 a render.
  if (caps.safetyTolerance) {
    falBody.safety_tolerance = caps.safetyTolerance;
  }
  // Sound on/off — ALWAYS sent explicitly where supported so cost is predictable
  // (audio can double the price on Kling 2.6 and Veo).
  if (caps.audioParam) {
    falBody[caps.audioParam] = typeof body.sound === 'boolean' ? body.sound : caps.audioDefault;
  }

  try {
    const falRes = await fetch(queueSubmitUrl(endpoint.slug), {
      method: 'POST',
      headers: { Authorization: falAuthHeader(body.userApiKey), 'Content-Type': 'application/json' },
      body: JSON.stringify(falBody),
    });

    if (!falRes.ok) {
      if (falRes.status === 401 || falRes.status === 403) {
        return bad(401, 'Fal.ai rejected your API key. Check the token in your vault.');
      }
      if (falRes.status === 404) {
        return bad(502, 'This model is not available on your Fal account yet (beta). Try Seedance 2.');
      }
      return bad(502, `Render service error (${falRes.status}). Try again.`);
    }

    const queued = (await falRes.json()) as { request_id?: string; status?: string };
    if (!queued.request_id) return bad(502, 'Render service did not return a tracking token.');

    return Response.json(
      {
        ok: true,
        trackingToken: queued.request_id,
        status: queued.status ?? 'IN_QUEUE',
        model: body.model,
        output: endpoint.output,
        summary: {
          model: body.model,
          camera: compiled.camera.label,
          lens: compiled.lens.label,
          focalLength: hw.focalLength,
          aperture: hw.aperture,
          iso: clamp(hw.isoValue, 100, 6400),
          grain: clamp(hw.cineNoise, 0, 100),
          genre: hw.genreStyle,
          style: hw.style,
          auto,
        },
      },
      { headers: NO_STORE },
    );
  } catch {
    return bad(504, 'Could not reach the render service. Try again.');
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
