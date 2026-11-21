export function getOrderNotification(order, cafes) {
  if (!['Ready', 'Done'].includes(order.status)) return null;
  const ready = order.status === 'Ready';
  return {
    key: `${order.orderId}:${order.createdAt}:${order.status.toLowerCase()}`,
    orderId: order.orderId,
    queueNumber: order.queueNumber,
    cafe: cafes.find((cafe) => cafe.cafeId === order.cafeId)?.name ?? `Café #${order.cafeId}`,
    pickupPoint: order.pickupPoint,
    title: ready ? 'Your order is ready!' : 'Your order is completed!',
    detail: ready ? 'Ready for pickup' : 'Marked Done by the café',
    linkLabel: ready ? 'View pickup details →' : 'View order details →',
    status: order.status,
  };
}
