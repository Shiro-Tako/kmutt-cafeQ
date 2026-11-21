export function getOrderNotification(order, cafes, menu = []) {
  if (!['Ready', 'Done'].includes(order.status)) return null;
  const ready = order.status === 'Ready';
  return {
    key: `${order.orderId}:${order.createdAt}:${order.status.toLowerCase()}`,
    orderId: order.orderId,
    image: menu.find((item) => String(item.menuItemId) === String(order.items?.[0]?.menuItemId))?.image,
    imageAlt: order.items?.[0]?.name ?? '',
    queueNumber: order.queueNumber,
    cafe: cafes.find((cafe) => cafe.cafeId === order.cafeId)?.name ?? `Café #${order.cafeId}`,
    pickupPoint: order.pickupPoint,
    title: ready ? 'Your order is ready!' : 'Your order is completed!',
    detail: ready ? 'Ready for pickup' : 'Marked Done by the café',
    linkLabel: ready ? 'View pickup details →' : 'View order details →',
    status: order.status,
  };
}
