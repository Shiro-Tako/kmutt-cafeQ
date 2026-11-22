import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from '../backend/node_modules/mysql2/promise.js';
import { createCampusState } from '../backend/src/demo/campusSeed.js';
import { rowsFrom, tables } from '../backend/src/demo/mysqlStore.js';

// Explicit maintenance command; never run automatically on server startup.
if (!process.argv.includes('--keep-real-accounts') || !process.argv.includes('--confirm-reset')) {
  throw new Error('This clears catalog/order/demo data. Back up first. Required flags: --keep-real-accounts --confirm-reset');
}
const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('.local/server.json', root), 'utf8'));
const connection = await mysql.createConnection({ host: '127.0.0.1', port: config.dbPort, user: 'cafeq', password: config.dbPassword, database: 'kmutt_cafeq' });
const backupDirectory = new URL('.local/backups/', root);
await mkdir(backupDirectory, { recursive: true });
const backupPath = new URL(`before-campus-reset-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, backupDirectory);
// Child tables first; foreign keys remain enabled throughout the transaction.
const deleteOrder = ['Queue', 'OrderDetail', 'payments', 'order_items', 'Order', 'orders', 'favorites', 'sessions', 'cafe_owners', 'cafe_staff', 'Menu', 'menu_items', 'Staff', 'Customer', 'cafes', 'profile_photos', 'users'];
try {
  await connection.beginTransaction();
  // The running demo uses this same lock, so concurrent requests wait for the reset.
  await connection.query('SELECT initialized FROM app_lock WHERE id = 1 FOR UPDATE');
  const backup = { database: 'kmutt_cafeq', createdAt: new Date().toISOString(), tables: {} };
  for (const name of [...deleteOrder, 'app_lock']) {
    const [rows] = await connection.query('SELECT * FROM `' + name + '`');
    backup.tables[name] = rows;
  }
  await writeFile(backupPath, JSON.stringify(backup, null, 2), { flag: 'wx' });
  const { users, Customer: customers, profile_photos: photos } = backup.tables;
  const retained = users.filter((user) => !user.email.toLowerCase().endsWith('@example.test')).map((user) => ({
    userId: user.id, name: user.name, email: user.email, passwordHash: user.password_hash,
    phone: customers.find((customer) => customer.customer_id === user.id)?.phone ?? null,
    photo: photos.find((entry) => entry.user_id === user.id)?.photo,
  }));
  const state = createCampusState(config.accountPassword, retained);
  // Reuse the persistence adapter's column order and parameterized row conversion.
  const [schemaTables] = await connection.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
  if (!deleteOrder.every((name) => schemaTables.some((row) => row.TABLE_NAME.toLowerCase() === name.toLowerCase()))) throw new Error('Expected CafeQ tables are missing.');
  for (const name of deleteOrder) await connection.query('DELETE FROM `' + name + '`');
  const rows = rowsFrom(state);
  for (let index = 0; index < tables.length; index++) {
    const [name, columns] = tables[index];
    for (const row of rows[index]) {
      await connection.execute('INSERT INTO `' + name + '` (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')', row);
    }
  }
  await connection.query('UPDATE app_lock SET initialized = 1 WHERE id = 1');
  await connection.commit();
  console.log(JSON.stringify({ retainedRealAccounts: retained.length, stores: state.cafes.length, menuItems: state.menu.length, orders: 0, backup: fileURLToPath(backupPath) }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
