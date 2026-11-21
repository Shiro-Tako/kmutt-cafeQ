import { OrderError } from '../services/orders.js';

function positiveId(value) { const id = Number(value); return /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(id) ? id : null; }

function sendError(error, response, next) {
  if (error instanceof OrderError) return response.status(error.status).json({ error: { code: error.code, message: error.message } });
  if (error.code?.startsWith('ER_') || ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)) return response.status(503).json({ error: { code: 'ORDERS_UNAVAILABLE', message: 'Order data is temporarily unavailable.' } });
  return next(error);
}

export function createOrderController(service) {
  return {
    quote: async (request, response, next) => { try { response.json(await service.quote(request.body)); } catch (error) { sendError(error, response, next); } },
    confirm: async (request, response, next) => { try { const order = await service.confirm(request.body, request.user.userId); response.status(201).json(order); } catch (error) { sendError(error, response, next); } },
    list: async (request, response, next) => { try { response.json({ items: await service.listForUser(request.user.userId) }); } catch (error) { sendError(error, response, next); } },
    get: async (request, response, next) => { try { const id = positiveId(request.params.id); if (!id) return response.status(400).json({ error: { code: 'INVALID_ORDER_ID', message: 'Use a positive order ID.' } }); const order = await service.getForUser(request.user.userId, id); if (!order) return response.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' } }); response.json(order); } catch (error) { sendError(error, response, next); } },
    staffList: async (request, response, next) => { try { response.json({ items: await service.listForCafe(request.params.cafeId, request.query.status) }); } catch (error) { sendError(error, response, next); } },
    staffStatus: async (request, response, next) => { try { const id = positiveId(request.params.id); if (!id) return response.status(400).json({ error: { code: 'INVALID_ORDER_ID', message: 'Use a positive order ID.' } }); response.json(await service.updateStatus(Number(request.params.cafeId), id, request.body?.status)); } catch (error) { sendError(error, response, next); } },
  };
}
