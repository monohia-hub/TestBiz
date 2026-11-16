// Tiny zero-dependency static file server for the Startup Ladder prototype.
// Usage: node server.js   (serves this folder on http://localhost:5174)
// GET /art/_list.json returns the image files in art/, so dropped-in art shows up automatically.
// GET /town/... serves the Pebblewick layout and models used as the 3D stage (read-only): a bundled ./town folder
// if there is one (the repo copy), otherwise the sibling ../forest-mockup project it was copied from.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TOWN_ROOT = fs.existsSync(path.join(ROOT, 'town')) ? path.join(ROOT, 'town') : path.join(ROOT, '..', 'forest-mockup');
const ART_DIR = path.join(ROOT, 'art');
const PORT = Number(process.env.PORT) || 5174;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.fbx': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};
const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i;

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    if (urlPath === '/art/_list.json') {
      fs.readdir(ART_DIR, (err, files) => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(err ? [] : files.filter((f) => IMAGE.test(f)).sort()));
      });
      return;
    }

    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const inTown = urlPath.startsWith('/town/');
    const base = inTown ? TOWN_ROOT : ROOT;
    const file = path.normalize(path.join(base, inTown ? urlPath.slice('/town'.length) : urlPath));
    if (!file.startsWith(base + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Startup Ladder running at http://localhost:${PORT}`));
