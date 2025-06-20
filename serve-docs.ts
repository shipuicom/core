// serve.ts
import { readdirSync } from 'fs';
import { extname, join } from 'path';

const project = 'design-system';
const buildDir = `./dist/${project}/browser`;
const port = 3000;

console.log(`Serving static files from ${buildDir} on port ${port}`);

// A simple function to get the correct MIME type for a file
function getMimeType(filePath: string): string {
  const extension = extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = join(buildDir, url.pathname);

    // If the path is a directory, serve the index.html file
    try {
      const stats = await Bun.file(filePath).exists();
      if (stats && readdirSync(filePath)) {
        filePath = join(filePath, 'index.html');
      }
    } catch {
      // It's not a directory, continue
    }

    const file = Bun.file(filePath);
    const fileExists = await file.exists();

    if (fileExists) {
      return new Response(file, {
        headers: { 'Content-Type': getMimeType(filePath) },
      });
    }

    // Handle client-side routing (SPA fallback)
    const indexFile = Bun.file(join(buildDir, 'index.html'));
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
  error() {
    return new Response('Not Found', { status: 404 });
  },
});
