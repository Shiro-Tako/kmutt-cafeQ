import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import healthRoutes from './routes/health.js';
import { createCatalogRouter } from './routes/catalog.js';
import { createAuthRouter } from './routes/auth.js';
import { createFavoritesRouter } from './routes/favorites.js';
import { requireStaffCafe } from './middleware/auth.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = '127.0.0.1';

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api', createAuthRouter());
app.use('/api', createFavoritesRouter());
app.use('/api', createCatalogRouter(requireStaffCafe));

app.listen(port, host, () => {
  console.log(`API listening at http://${host}:${port}`);
});
