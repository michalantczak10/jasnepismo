import { defineConfig, type Plugin } from 'vite';
import path from 'path';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEV_SECRET = 'dev-preview-secret-do-not-use-in-prod';
const PREVIEWS_DIR = resolve(process.cwd(), 'img/previews');
const ALLOWED_FILE = /^[a-z0-9-]+-v[123]\.(?:webp|jpg)$/;

function previewApiPlugin(): Plugin {
  return {
    name: 'preview-api',
    configureServer(server) {
      server.middlewares.use('/api/preview-token', (_req, res) => {
        const exp = Math.floor(Date.now() / 1000) + 300;
        const token = createHmac('sha256', DEV_SECRET).update(String(exp)).digest('hex');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ token, exp }));
      });

      server.middlewares.use('/api/preview-img', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const file = url.searchParams.get('file') ?? '';
        if (!ALLOWED_FILE.test(file)) { res.statusCode = 400; res.end(); return; }
        const filePath = join(PREVIEWS_DIR, file);
        if (!filePath.startsWith(PREVIEWS_DIR)) { res.statusCode = 403; res.end(); return; }
        try {
          const data = readFileSync(filePath);
          const ct = file.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          res.setHeader('Content-Type', ct);
          res.setHeader('Cache-Control', 'no-store');
          res.end(data);
        } catch {
          res.statusCode = 404; res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [previewApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
