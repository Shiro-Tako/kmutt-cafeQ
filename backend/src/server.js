import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import healthRoutes from './routes/health.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = '127.0.0.1';

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use('/api', healthRoutes);

app.listen(port, host, () => {
  console.log(`API listening at http://${host}:${port}`);
});
