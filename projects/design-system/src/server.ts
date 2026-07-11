import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { Hono } from 'hono';

const app = new Hono();
const angularApp = new AngularAppEngine();

/**
 * Example Hono REST API endpoints can be defined here.
 *
 * Example:
 * ```ts
 * app.get('/api/*', (c) => c.json({ ok: true }));
 * ```
 */

/**
 * Handle all requests by rendering the Angular application.
 */
app.use('/*', async (c) => {
  const response = await angularApp.handle(c.req.raw);
  return response ?? c.notFound();
});

/**
 * The request handler used by the Angular CLI.
 *
 * The design-system builds with `outputMode: "static"` (SSG), so this handler is
 * only exercised at build time to prerender routes — no runtime server bundle is
 * emitted. The prerendered `dist/design-system/browser` output is served in
 * production by `scripts/serve-design-system.ts` (Bun + Hono).
 */
export const reqHandler = createRequestHandler(app.fetch);
