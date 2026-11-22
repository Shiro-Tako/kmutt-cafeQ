// กำหนดเส้นทาง GET /api/health ให้เรียก health controller
import { Router } from 'express';
import { getHealth } from '../controllers/health.js';

const router = Router();

router.get('/health', getHealth);

export default router;
