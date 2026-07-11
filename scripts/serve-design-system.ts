/**
 * Standalone Bun + Hono static file server for the prerendered design-system.
 *
 * `ng build design-system` uses `outputMode: "static"` (SSG), so it emits only
 * `dist/design-system/browser` — fully prerendered HTML plus hashed assets, and
 * no runtime server. This script serves that output on Bun with a prerender/SPA
 * fallback so client-side navigation and deep links keep working.
 *
 * Run from the repo root (npm scripts already do):
 *   bun scripts/serve-design-system.ts
 *
 * Honors the PORT env var (defaults to 4000).
 */
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';

const browserDist = 'dist/design-system/browser';
const port = Number(process.env['PORT'] ?? 4000);

const app = new Hono();

/**
 * Serve the prerendered browser output. `node:path`'s join (used by hono/bun)
 * treats the relative root against the working directory, which npm scripts run
 * from the repo root.
 */
app.use(
  '/*',
  serveStatic({
    root: browserDist,
    onFound: (path, c) => {
      // Prerendered HTML must revalidate; hashed assets are immutable.
      c.header(
        'Cache-Control',
        path.endsWith('.html')
          ? 'no-cache'
          : 'public, max-age=31536000, immutable'
      );
    },
  })
);

/**
 * Prerender / SPA fallback: a route request that wasn't prerendered (no file
 * extension) gets the shell so the Angular router can hydrate and take over;
 * a missing asset (has an extension) is a genuine 404.
 */
app.notFound(async (c) => {
  const { pathname } = new URL(c.req.url);
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return c.text('Not Found', 404);
  }

  const index = Bun.file(`${browserDist}/index.html`);
  if (await index.exists()) {
    return new Response(index, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }

  return c.text('Not Found', 404);
});

Bun.serve({ port, fetch: app.fetch });
console.log(`Design-system (Bun + Hono) listening on http://localhost:${port}`);
console.log(`Serving ./${browserDist}`);
