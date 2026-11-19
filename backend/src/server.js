import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import healthRoutes from './routes/health.js';
import { createCatalogRouter } from './routes/catalog.js';
import demoRoutes, { requireDemoStaff } from './demo/router.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = '127.0.0.1';

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api', demoRoutes);
app.use('/api', createCatalogRouter(requireDemoStaff));
app.use((error, _request, response, _next) => {
  response.status(error.status ?? 500).json({
    error: { code: error.code ?? 'SERVER_ERROR', message: error.status ? error.message : 'The server could not complete this request.' },
  });
});

const server = app.listen(port, host, () => {
  console.log(`API listening at http://${host}:${server.address().port}`);
});
