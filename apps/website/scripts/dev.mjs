import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;
const port = Number.parseInt(process.env.PORT ?? '5173', 10);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  const requestPath = (request.url ?? '/').split('?')[0] ?? '/';
  const relativePath =
    requestPath === '/' ? 'index.html' : normalize(requestPath).replace(/^(\.\.\/)+/, '');
  const filePath = join(root, relativePath);

  try {
    await stat(filePath);
    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`VAHU website: http://127.0.0.1:${port}`);
});
