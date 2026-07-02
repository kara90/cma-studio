/**
 * lib/falConfig.ts — Fal.ai queue config (server-only).
 * Generic queue URL builders keyed by a model slug (the slug comes from
 * lib/modelEndpoints.ts). BYOK: users authenticate each call with their own key.
 */

export const FAL_QUEUE_BASE = 'https://queue.fal.run';

/**
 * Fal's queue keys a job by the base APPLICATION id (owner/app), NOT the full
 * operation slug. A submit to `fal-ai/kling-video/v2.5-turbo/pro/text-to-video`
 * is polled at `fal-ai/kling-video/requests/{id}/status`. Reconstructing status
 * with the full slug 404s and hangs the render — so status/result strip the
 * operation sub-path back to the first two segments.
 */
const baseApp = (slug: string) => slug.split('/').slice(0, 2).join('/');

export const queueSubmitUrl = (slug: string) => `${FAL_QUEUE_BASE}/${slug}`;
export const queueStatusUrl = (slug: string, requestId: string) =>
  `${FAL_QUEUE_BASE}/${baseApp(slug)}/requests/${requestId}/status`;
export const queueResultUrl = (slug: string, requestId: string) =>
  `${FAL_QUEUE_BASE}/${baseApp(slug)}/requests/${requestId}`;

/** Auth header shape Fal expects for a raw REST call. */
export const falAuthHeader = (userApiKey: string) => `Key ${userApiKey}`;
