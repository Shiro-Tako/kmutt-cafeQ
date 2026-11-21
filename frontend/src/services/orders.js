import { requestJson } from './api.js';
import { demoItemIds } from './catalog.js';

export const quoteOrder = (body, signal) => requestJson('/checkout/quote', { method: 'POST', body, signal });
export const confirmOrder = (body) => requestJson('/checkout/confirm', { method: 'POST', body });
export const getOrders = (signal) => requestJson('/orders', { signal });
export const confirmPickup = (id) => requestJson(`/orders/${id}/pickup`, { method: 'PATCH' });
export const getStaffOrders = (cafeId, signal) => requestJson(`/staff/cafes/${cafeId}/orders`, { signal });
export const updateOrderStatus = (cafeId, id, status) =>
  requestJson(`/staff/cafes/${cafeId}/orders/${id}/status`, { method: 'PATCH', body: { status } });

export function toDisplayOrder(order, cafes) {
  const date = new Date(order.createdAt);
  const lines = order.items.map(({ menuItemId, name, quantity }) => ({
    id: demoItemIds[menuItemId] ?? String(menuItemId), name, quantity,
  }));
  return {
    id: order.orderId,
    cafeId: order.cafeId,
    pickupPoint: order.pickupPoint,
    queueNumber: order.queueNumber,
    cafe: cafes.find(({ cafeId }) => cafeId === order.cafeId)?.name ?? `Café #${order.cafeId}`,
    customer: order.customerName ?? 'Customer',
    status: order.status,
    date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    total: order.total / 100,
    lines,
  };
}
