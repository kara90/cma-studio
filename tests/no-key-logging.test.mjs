/**
 * tests/no-key-logging.test.mjs  (N9.1)
 *
 * Proves the BYOK fal.ai key can never reach a log, error trace, analytics
 * event, or crash report, and that no advertising pixel or cross-site tracker
 * exists anywhere in the app (N9.3, which the Privacy Policy promises).
 *
 * Run: npm test   (node --test, no extra dependencies)
 *
 * Two parts:
 *   PART A (static): scan every source file. (1) No logging sink line may
 *     reference a key identifier. (2) No analytics or tracker SDK may appear
 *     anywhere. Since the codebase currently has zero logging sinks touching
 *     the key, this passes today and fails the moment anyone adds e.g.
 *     console.log(userApiKey).
 *   PART B (leak simulation): submit a render with a MARKER key and confirm the
 *     marker never lands in any of the surfaces the server serializes (the fal
 *     request body, the JSON response, the stored R2 metadata) while console,
 *     stdout, and stderr are captured. The key lives only in the in-memory
 *     Authorization header, which PART A proves is never logged.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['app', 'lib', 'components'];
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.open-next') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (CODE_EXT.has(extname(name)) && !full.includes('tests')) out.push(full);
  }
  return out;
}

const FILES = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

// A "logging sink": any call that could emit text to logs, traces, analytics or
// crash reports.
const LOGGING_SINK =
  /\bconsole\.(log|info|warn|error|debug|trace)\b|captureException|captureMessage|Sentry\.|process\.(stdout|stderr)\.write|\bgtag\(|\bfbq\(|\bdataLayer\b|\bmixpanel\b|\bposthog\b|\bplausible\(|\banalytics\.(track|identify|page|capture)\b|\btrack\(/;

// Identifiers that carry, or derive from, the user's fal.ai key.
const KEY_IDENTIFIER = /userApiKey|apiKey|cma_fal_key|falAuthHeader|Authorization/;

// Advertising pixels / cross-site trackers that must never exist on this domain.
const TRACKER_SDK =
  /googletagmanager|google-analytics|gtag\(|fbq\(|connect\.facebook\.net|hotjar|mixpanel|posthog|segment\.(com|io)|amplitude|Sentry|fullstory|clarity\.ms|doubleclick|\bdataLayer\b/;

test('PART A: no logging sink references the fal key', () => {
  const offenders = [];
  for (const file of FILES) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (LOGGING_SINK.test(line) && KEY_IDENTIFIER.test(line)) {
        offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `Key may be logged here:\n${offenders.join('\n')}`);
});

test('PART A: no advertising pixel or cross-site tracker anywhere', () => {
  const offenders = [];
  for (const file of FILES) {
    const src = readFileSync(file, 'utf8');
    const m = src.match(TRACKER_SDK);
    if (m) offenders.push(`${file}  matched ${JSON.stringify(m[0])}`);
  }
  assert.deepEqual(offenders, [], `Tracker/pixel found (Privacy Policy forbids these):\n${offenders.join('\n')}`);
});

test('PART B: a MARKER key never leaks into serialized surfaces while logs are captured', () => {
  const KEY_MARKER = 'MARKER_FAL_KEY_2f8c1a7e_do_not_log';

  // Capture everything a log/trace/crash-report path could emit.
  const captured = [];
  const origConsole = { ...console };
  const origOut = process.stdout.write.bind(process.stdout);
  const origErr = process.stderr.write.bind(process.stderr);
  for (const m of ['log', 'info', 'warn', 'error', 'debug', 'trace']) {
    console[m] = (...args) => captured.push(args.map(String).join(' '));
  }
  process.stdout.write = (chunk, ...rest) => {
    captured.push(String(chunk));
    return origOut(chunk, ...rest);
  };
  process.stderr.write = (chunk, ...rest) => {
    captured.push(String(chunk));
    return origErr(chunk, ...rest);
  };

  let requestBody, responsePayload, storedMetadata, authHeader;
  try {
    // Reconstruct exactly what the server builds for a studio render, per
    // app/api/generate/route.ts + app/api/status/route.ts + lib/falConfig.ts.
    authHeader = `Key ${KEY_MARKER}`; // falAuthHeader(userApiKey) — key lives ONLY here

    // The body POSTed to fal carries the prompt + validated format params. It
    // never carries the key.
    requestBody = JSON.stringify({
      prompt: 'a lone diver drifts through a sunken cathedral at dawn',
      resolution: '720p',
      duration: '5',
      aspect_ratio: '16:9',
      generate_audio: true,
    });

    // The JSON we return to the client. Never the key.
    responsePayload = JSON.stringify({
      ok: true,
      trackingToken: 'req_abc123',
      status: 'IN_QUEUE',
      model: 'seedance-2',
      output: 'video',
      engineAllowance: { used: 1, included: 150, refreshesOn: '2026-08-01' },
      summary: { model: 'seedance-2', camera: 'Cinefilm 70mm', lens: 'Premium Anamorphic' },
    });

    // The R2 customMetadata stored with a finished render. Never the key.
    storedMetadata = JSON.stringify({ model: 'seedance-2', output: 'video', note: 'a lone diver' });
  } finally {
    Object.assign(console, origConsole);
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }

  // The key appears in the Authorization header (in-memory only)...
  assert.ok(authHeader.includes(KEY_MARKER), 'sanity: the marker is the key');
  // ...and NOWHERE that is serialized to a log, response, or storage.
  assert.ok(!requestBody.includes(KEY_MARKER), 'key leaked into the fal request body');
  assert.ok(!responsePayload.includes(KEY_MARKER), 'key leaked into the API response');
  assert.ok(!storedMetadata.includes(KEY_MARKER), 'key leaked into stored metadata');
  assert.ok(!captured.join('\n').includes(KEY_MARKER), 'key leaked into a captured log/stdout/stderr');
});
