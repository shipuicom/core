import { AngularAppEngine } from '@angular/ssr';
import { getRequestListener, serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = new Hono();
const angularApp = new AngularAppEngine();

/**
 * Example Hono Rest API endpoints can be defined here.
 * app.get('/api/**', (c) => c.json({ data: 'hello' }));
 */

/**
 * Serve static files from /browser
 * Explicitly rewrites asset routing dynamically preventing 404s when paths misalign during runtime.
 */
app.use('/*', async (c, next) => {
  const staticUrl = new URL(c.req.url).pathname;
  // Let Angular handle SSR if it's a page navigation
  if (!staticUrl.includes('.')) return next();

  const serveMiddleware = serveStatic({
    root: browserDistFolder,
    rewriteRequestPath: (p) => p,
  });
  return serveMiddleware(c, next);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('/*', async (c) => {
  const res = await angularApp.handle(c.req.raw);
  if (res) {
    return res;
  }
  return c.notFound();
});

/**
 * Start the server if this module is the main entry point.
 */
const isMainModule = import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  const port = Number(process.env['PORT']) || 4000;

  // @ts-ignore
  if (typeof Bun !== 'undefined') {
    // Execute via Bun's native V8 HTTP engine natively
    // @ts-ignore
    Bun.serve({
      port,
      fetch: app.fetch,
    });
    console.log(`Bun (Hono) server listening on http://localhost:${port}`);
  } else {
    // Execute gracefully falling back down to Node for classic runtime support
    serve(
      {
        fetch: app.fetch,
        port,
      },
      (info) => {
        console.log(`Node (Hono) server listening on http://localhost:${info.port}`);
      }
    );
  }
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = getRequestListener(app.fetch);
