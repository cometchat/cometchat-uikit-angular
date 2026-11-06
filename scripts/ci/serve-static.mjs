#!/usr/bin/env node
// Serves a built Angular app (e.g. dist/sample-app/browser) for E2E in CI, so tests run
// against the production build customers ship instead of `ng serve`. Unknown paths without a
// file extension fall back to index.html, as the app uses client-side routing.
// Usage: node scripts/ci/serve-static.mjs <dir> <port>
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/sample-app/browser');
const port = Number(process.argv[3] ?? 4200);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
};

async function fileFor(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = normalize(join(root, decoded));
  if (!target.startsWith(root)) return null; // no path traversal
  try {
    const s = await stat(target);
    if (s.isFile()) return target;
    if (s.isDirectory()) return join(target, 'index.html');
  } catch {
    // fall through
  }
  return extname(decoded) ? null : join(root, 'index.html');
}

createServer(async (req, res) => {
  const file = await fileFor(req.url ?? '/');
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
