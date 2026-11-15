import { Router } from 'express';
import { getCafes, getMenuItem, getMenuItems } from '../controllers/catalog.js';

const router = Router();

router.get('/cafes', getCafes);
router.get('/menu-items', getMenuItems);
router.get('/menu-items/:id', getMenuItem);

export default router;
