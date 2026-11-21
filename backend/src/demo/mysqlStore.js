import { pool } from '../config/database.js';

const tables = [
  ['cafes', ['id', 'name', 'pickup_point']],
  ['users', ['id', 'name', 'email', 'password_hash']],
  ['cafe_staff', ['user_id', 'cafe_id']],
  ['menu_items', ['id', 'cafe_id', 'name', 'category', 'description', 'price', 'image_url', 'is_active']],
  ['sessions', ['token_hash', 'user_id', 'expires_at']],
  ['favorites', ['user_id', 'menu_item_id']],
  ['orders', ['id', 'user_id', 'cafe_id', 'pickup_point', 'status', 'subtotal', 'packaging_fee', 'total', 'created_at', 'customer_name']],
  ['order_items', ['order_id', 'menu_item_id', 'name', 'unit_price', 'quantity']],
  ['payments', ['order_id', 'user_id', 'confirmation_id', 'fingerprint', 'amount', 'method', 'status']],
  ['Customer', ['customer_id', 'name', 'email', 'password_hash', 'phone']],
  ['Staff', ['staff_id', 'name', 'email', 'password_hash', 'role']],
  ['Menu', ['menu_id', 'cafe_id', 'name', 'category', 'description', 'price', 'image_url', 'available']],
  ['Order', ['order_id', 'customer_id', 'cafe_id', 'pickup_point', 'status', 'subtotal', 'packaging_fee', 'total_price', 'order_date', 'customer_name']],
  ['OrderDetail', ['order_id', 'menu_id', 'name', 'price', 'quantity']],
  ['Queue', ['queue_id', 'order_id', 'cafe_id', 'queue_number', 'queue_date', 'status']],
  ['cafe_owners', ['cafe_id', 'user_id']],
];

function rowsFrom(state) {
  return [
    state.cafes.map((r) => [r.cafeId, r.name, r.pickupPoint]),
    state.users.map((r) => [r.userId, r.name, r.email, r.passwordHash]),
    state.users.flatMap((r) => r.staffCafeIds.map((id) => [r.userId, id])),
    state.menu.map((r) => [r.menuItemId, r.cafeId, r.name, r.category, r.description, r.price, r.imageUrl ?? null, Number(r.isActive)]),
    state.sessions.map((r) => [r.hash, r.userId, r.expires]),
    state.favorites.map((r) => [r.userId, r.menuItemId]),
    state.orders.map((r) => [r.orderId, r.userId, r.cafeId, r.pickupPoint, r.status, r.subtotal, r.packagingFee, r.total, r.createdAt, r.customerName]),
    state.orders.flatMap((order) => order.items.map((r) => [order.orderId, r.menuItemId, r.name, r.unitPrice, r.quantity])),
    state.payments.map((r) => [r.orderId, r.userId, r.confirmationId, r.fingerprint, r.amount, r.method, r.status]),
    state.users.map((r) => [r.userId, r.name, r.email, r.passwordHash, r.phone ?? null]),
    state.users.filter((r) => r.staffCafeIds.length).map((r) => [r.userId, r.name, r.email, r.passwordHash, r.role ?? 'staff']),
    state.menu.map((r) => [r.menuItemId, r.cafeId, r.name, r.category, r.description, r.price, r.imageUrl ?? null, Number(r.isActive)]),
    state.orders.map((r) => [r.orderId, r.userId, r.cafeId, r.pickupPoint, r.status, r.subtotal, r.packagingFee, r.total, r.createdAt, r.customerName]),
    state.orders.flatMap((order) => order.items.map((r) => [order.orderId, r.menuItemId, r.name, r.unitPrice, r.quantity])),
    state.orders.map((r) => [r.orderId, r.orderId, r.cafeId, r.queueNumber, r.queueDate, r.status]),
    state.cafes.filter((r) => r.ownerUserId).map((r) => [r.cafeId, r.ownerUserId]),
  ];
}

async function load(connection) {
  const data = [];
  for (const [name] of tables) {
    const [rows] = await connection.query('SELECT * FROM `' + name + '`');
    data.push(rows);
  }
  const [cafes, users, staff, menu, sessions, favorites, orders, lines, payments, customers, staffAccounts, , , , queues] = data;
  return {
    cafes: cafes.map((r) => ({ cafeId: r.id, name: r.name, pickupPoint: r.pickup_point, ownerUserId: data[15].find((entry) => entry.cafe_id === r.id)?.user_id })),
    users: users.map((r) => ({
      userId: r.id, name: r.name, email: r.email, passwordHash: r.password_hash,
      phone: customers.find((entry) => entry.customer_id === r.id)?.phone ?? null,
      role: staffAccounts.find((entry) => entry.staff_id === r.id)?.role ?? 'customer',
      staffCafeIds: staff.filter((s) => s.user_id === r.id).map((s) => s.cafe_id),
    })),
    menu: menu.map((r) => ({ menuItemId: r.id, cafeId: r.cafe_id, name: r.name, category: r.category, description: r.description, price: r.price, imageUrl: r.image_url, isActive: Boolean(r.is_active) })),
    sessions: sessions.map((r) => ({ hash: r.token_hash, userId: r.user_id, expires: Number(r.expires_at) })),
    favorites: favorites.map((r) => ({ userId: r.user_id, menuItemId: r.menu_item_id })),
    orders: orders.map((r) => ({
      orderId: r.id, userId: r.user_id, cafeId: r.cafe_id, pickupPoint: r.pickup_point, status: r.status,
      subtotal: r.subtotal, packagingFee: r.packaging_fee, total: r.total, createdAt: r.created_at, customerName: r.customer_name,
      queueNumber: queues.find((entry) => entry.order_id === r.id)?.queue_number,
      queueDate: queues.find((entry) => entry.order_id === r.id)?.queue_date,
      items: lines.filter((line) => line.order_id === r.id).map((line) => ({ menuItemId: line.menu_item_id, name: line.name, unitPrice: line.unit_price, quantity: line.quantity })),
    })),
    payments: payments.map((r) => ({ orderId: r.order_id, userId: r.user_id, confirmationId: r.confirmation_id, fingerprint: r.fingerprint, amount: r.amount, method: r.method, status: r.status })),
  };
}

// The single coordinator row serializes the small demo's mutations across processes.
export async function transactMysql(action, seed) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[lock]] = await connection.query('SELECT initialized FROM app_lock WHERE id = 1 FOR UPDATE');
    let state = await load(connection);
    if (!lock.initialized) state = await seed();
    const before = lock.initialized ? rowsFrom(state) : tables.map(() => []);
    const result = await action(state);
    const after = rowsFrom(state);
    // Session and favorite deletion are the only physical deletions in the app.
    for (const index of [4, 5]) {
      const [name, columns] = tables[index];
      const keyCount = index === 4 ? 1 : 2;
      for (const row of before[index]) {
        if (!after[index].some((entry) => entry.slice(0, keyCount).every((value, key) => value === row[key]))) {
          await connection.execute('DELETE FROM ' + name + ' WHERE ' + columns.slice(0, keyCount).map((column) => column + ' = ?').join(' AND '), row.slice(0, keyCount));
        }
      }
    }
    for (let index = 0; index < tables.length; index++) {
      const [name, columns] = tables[index];
      const oldRows = new Set(before[index].map((row) => JSON.stringify(row)));
      for (const row of after[index]) {
        if (oldRows.has(JSON.stringify(row))) continue;
        const assignments = columns.map((column) => column + '=VALUES(' + column + ')').join(',');
        await connection.execute('INSERT INTO `' + name + '` (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ') ON DUPLICATE KEY UPDATE ' + assignments, row);
      }
    }
    await connection.query('UPDATE app_lock SET initialized = 1 WHERE id = 1');
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
