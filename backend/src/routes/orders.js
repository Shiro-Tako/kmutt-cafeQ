import { Router } from 'express';
import { createOrderController } from '../controllers/orders.js';
import { createOrderService } from '../services/orders.js';
import { orders } from '../repositories/orders.js';

function positiveCafe(request, response, next) {
  const cafeId = Number(request.params.cafeId);
  if (!/^[1-9]\d*$/.test(request.params.cafeId) || !Number.isSafeInteger(cafeId)) {
    return response.status(400).json({ error: { code: 'INVALID_CAFE_ID', message: 'Use a positive cafe ID.' } });
  }
  response.locals.catalogCafeId = cafeId;
  next();
}

export function createOrdersRouter({ requireSession, requireStaffCafe, service = createOrderService(orders) } = {}) {
  const router = Router();
  const controller = createOrderController(service);
  router.post('/checkout/quote', requireSession, controller.quote);
  router.post('/checkout/confirm', requireSession, controller.confirm);
  router.get('/orders', requireSession, controller.list);
  router.get('/orders/:id', requireSession, controller.get);
  router.get('/staff/cafes/:cafeId/orders', positiveCafe, requireStaffCafe, controller.staffList);
  router.patch('/staff/cafes/:cafeId/orders/:id/status', positiveCafe, requireStaffCafe, controller.staffStatus);
  return router;
}
