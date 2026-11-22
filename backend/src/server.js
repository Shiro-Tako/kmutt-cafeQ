import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import healthRoutes from './routes/health.js';
import { createCatalogRouter } from './routes/catalog.js';
import demoRoutes, { requireDemoStaff } from './demo/router.js';
import { menuPhotoDirectory } from './repositories/menuPhotos.js';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = '127.0.0.1';

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use('/api/staff/cafes/:cafeId/menu-items', express.json({ limit: '512kb' }));
app.use(express.json());
app.use('/api/menu-photos', (request, response, next) => {
  if (!/^\/[a-f0-9]{64}\.jpg$/.test(request.path)) return response.sendStatus(404);
  response.set('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(menuPhotoDirectory, { index: false, redirect: false, immutable: true, maxAge: '1y' }));
app.use('/api', healthRoutes);
app.use('/api', demoRoutes);
app.use('/api', createCatalogRouter(requireDemoStaff));
app.use('/api', (_request, response) => response.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.' } }));
const frontend = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
if (existsSync(frontend)) {
  app.use(express.static(frontend, { setHeaders(response, path) {
    if (path.endsWith('index.html')) response.setHeader('Cache-Control', 'no-store');
  } }));
  app.get('/{*path}', (_request, response) => response.set('Cache-Control', 'no-store').sendFile(frontend + 'index.html'));
}
app.use((error, _request, response, _next) => {
  response.status(error.status ?? 500).json({
    error: { code: error.code ?? 'SERVER_ERROR', message: error.status ? error.message : 'The server could not complete this request.' },
  });
});

const server = app.listen(port, host, () => {
  console.log(`API listening at http://${host}:${server.address().port}`);
});
