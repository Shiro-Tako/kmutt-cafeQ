import { pool } from '../config/database.js';
import { catalog } from './catalog.js';

const rows = new Map();
let nextId = 301;

async function priceItems(cafeId, items) {
  const menu = await catalog.listMenuItems({ cafeId });
  const byId = new Map(menu.map((item) => [item.menuItemId, item]));
  return items.flatMap(({ menuItemId }) => {
    const item = byId.get(menuItemId);
    return item ? [{ menuItemId, name: item.name, unitPrice: item.price }] : [];
  });
}

const mockOrders = {
  async priceItems(cafeId, items) { return priceItems(cafeId, items); },
  async createOrder(input) {
    const existing = [...rows.values()].find((order) => order.userId === input.userId && order.confirmationId === input.confirmationId);
    if (existing) return existing;
    const order = { orderId: nextId++, ...input, status: 'Waiting', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: input.items };
    rows.set(order.orderId, order);
    return order;
  },
  async listForUser(userId) { return [...rows.values()].filter((order) => order.userId === userId).sort((a, b) => b.orderId - a.orderId); },
  async findForUser(userId, orderId) { const order = rows.get(orderId); return order?.userId === userId ? order : null; },
  async listForCafe(cafeId, status) { return [...rows.values()].filter((order) => order.cafeId === cafeId && (!status || order.status === status)); },
  async findForCafe(cafeId, orderId) { const order = rows.get(orderId); return order?.cafeId === cafeId ? order : null; },
  async updateStatus(_cafeId, orderId, status) { const order = rows.get(orderId); order.status = status; order.updatedAt = new Date().toISOString(); return order; },
};

function mapOrder(order, items) {
  return { orderId: order.id, userId: order.user_id, customerName: order.customer_name, cafeId: order.cafe_id, pickupPoint: order.pickup_point, status: order.status, subtotal: order.subtotal, packagingFee: order.packaging_fee, total: order.total, createdAt: new Date(order.created_at).toISOString(), updatedAt: new Date(order.updated_at).toISOString(), items };
}

const mysqlOrders = {
  async priceItems(cafeId, items) {
    const ids = items.map((item) => item.menuItemId);
    const [menu] = await pool.query(`SELECT id AS menuItemId, name, price AS unitPrice FROM menu_items WHERE cafe_id = ? AND is_active = 1 AND id IN (${ids.map(() => '?').join(',')})`, [cafeId, ...ids]);
    return menu;
  },
  async createOrder(input) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute('SELECT o.*, p.confirmation_id FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.user_id = ? AND p.confirmation_id = ? FOR UPDATE', [input.userId, input.confirmationId]);
      if (existing[0]) { await connection.rollback(); return this.findForUser(input.userId, existing[0].id); }
      const [created] = await connection.execute('INSERT INTO orders (user_id, cafe_id, pickup_point, status, subtotal, packaging_fee, total) SELECT ?, c.id, c.pickup_point, ?, ?, ?, ? FROM cafes c WHERE c.id = ?', [input.userId, 'Waiting', input.subtotal, input.packagingFee, input.total, input.cafeId]);
      await connection.query('INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity) VALUES ?', [input.items.map((item) => [created.insertId, item.menuItemId, item.name, item.unitPrice, item.quantity])]);
      await connection.execute('INSERT INTO payments (order_id, user_id, confirmation_id, request_fingerprint, amount, method, status, confirmed_at) VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())', [created.insertId, input.userId, input.confirmationId, input.requestFingerprint, input.total, 'promptpay_demo', 'confirmed']);
      await connection.commit();
      return this.findForUser(input.userId, created.insertId);
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  },
  async findForUser(userId, orderId) { const [orders] = await pool.execute('SELECT * FROM orders WHERE user_id = ? AND id = ?', [userId, orderId]); return orders[0] ? this.withItems(orders[0]) : null; },
  async listForUser(userId) { const [orders] = await pool.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]); return Promise.all(orders.map((order) => this.withItems(order))); },
  async listForCafe(cafeId, status) { const [orders] = await pool.execute('SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.cafe_id = ? AND (? IS NULL OR o.status = ?) ORDER BY o.created_at', [cafeId, status ?? null, status ?? null]); return Promise.all(orders.map((order) => this.withItems(order))); },
  async findForCafe(cafeId, orderId) { const [orders] = await pool.execute('SELECT * FROM orders WHERE cafe_id = ? AND id = ?', [cafeId, orderId]); return orders[0] ? this.withItems(orders[0]) : null; },
  async updateStatus(cafeId, orderId, status) { await pool.execute('UPDATE orders SET status = ?, updated_at = UTC_TIMESTAMP() WHERE cafe_id = ? AND id = ?', [status, cafeId, orderId]); return this.findForCafe(cafeId, orderId); },
  async withItems(order) { const [items] = await pool.execute('SELECT menu_item_id AS menuItemId, name, unit_price AS unitPrice, quantity FROM order_items WHERE order_id = ? ORDER BY menu_item_id', [order.id]); return mapOrder(order, items); },
};

export const orders = process.env.ORDER_SOURCE === 'mysql' ? mysqlOrders : mockOrders;
