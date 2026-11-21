import { randomUUID } from 'node:crypto';

export const ORDER_STATUSES = ['Waiting', 'Preparing', 'Ready', 'Done'];
const transitions = new Map(ORDER_STATUSES.map((status, index) => [status, ORDER_STATUSES[index + 1]]));

export class OrderError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function invalid(message = 'Provide a valid cafe and at least one item.') {
  return new OrderError(400, 'INVALID_ORDER', message);
}

function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw invalid();
  const seen = new Set();
  return items.map((item) => {
    if (!item || !Number.isSafeInteger(item.menuItemId) || item.menuItemId < 1 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
        seen.has(item.menuItemId)) throw invalid('Each item must have a unique positive ID and quantity.');
    seen.add(item.menuItemId);
    return { menuItemId: item.menuItemId, quantity: item.quantity };
  });
}

function parseRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      !Number.isSafeInteger(input.cafeId) || input.cafeId < 1) throw invalid();
  return { cafeId: input.cafeId, items: parseItems(input.items) };
}

function errorForUnavailable(item) {
  return new OrderError(409, 'ITEM_UNAVAILABLE', `Menu item ${item.menuItemId} is unavailable.`);
}

export function createOrderService(repository) {
  async function quote(input) {
    const { cafeId, items } = parseRequest(input);
    const priced = await repository.priceItems(cafeId, items);
    if (priced.length !== items.length) throw errorForUnavailable(items.find((item) => !priced.some((row) => row.menuItemId === item.menuItemId)) ?? items[0]);
    const byId = new Map(priced.map((item) => [item.menuItemId, item]));
    const normalized = items.map((item) => ({ ...byId.get(item.menuItemId), quantity: item.quantity }));
    const subtotal = normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const packagingFee = subtotal > 0 ? 500 : 0;
    return { cafeId, items: normalized, subtotal, packagingFee, total: subtotal + packagingFee };
  }

  return {
    quote,
    async confirm(input, userId) {
      if (!userId) throw new OrderError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
      if (typeof input?.confirmationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.confirmationId) ||
          !Number.isSafeInteger(input.expectedTotal) || input.expectedTotal < 1) throw invalid('Provide expectedTotal and confirmationId.');
      const priced = await quote(input);
      if (priced.total !== input.expectedTotal) throw new OrderError(409, 'PRICE_CHANGED', 'Review the updated total.');
      return repository.createOrder({ ...priced, userId, confirmationId: input.confirmationId, requestFingerprint: JSON.stringify({ cafeId: priced.cafeId, items: input.items, total: priced.total }) });
    },
    listForUser(userId) { return repository.listForUser(userId); },
    getForUser(userId, orderId) { return repository.findForUser(userId, orderId); },
    listForCafe(cafeId, status) {
      if (status !== undefined && !ORDER_STATUSES.includes(status)) throw invalid('Use a valid order status.');
      return repository.listForCafe(cafeId, status);
    },
    async updateStatus(cafeId, orderId, status) {
      if (!ORDER_STATUSES.includes(status)) throw invalid('Use a valid order status.');
      const order = await repository.findForCafe(cafeId, orderId);
      if (!order) throw new OrderError(404, 'ORDER_NOT_FOUND', 'Order not found.');
      if (transitions.get(order.status) !== status) throw new OrderError(409, 'INVALID_STATUS_TRANSITION', 'Order status must advance one step at a time.');
      return repository.updateStatus(cafeId, orderId, status);
    },
  };
}

export const newConfirmationId = randomUUID;
