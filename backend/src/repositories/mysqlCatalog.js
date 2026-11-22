// อ่านและแก้เมนูด้วยคำสั่ง MySQL ที่ส่งค่าแยกจากข้อความ SQL
import { pool } from '../config/database.js';

const columns = 'id AS menuItemId, cafe_id AS cafeId, name, category, description, price, image_url AS imageUrl, is_active AS isActive';

export const mysqlCatalog = {
  async listCafes() {
    const [rows] = await pool.execute('SELECT id AS cafeId, name, pickup_point AS pickupPoint FROM cafes ORDER BY id');
    return rows;
  },

  async listMenuItems({ cafeId, category, q = '' }) {
    const [rows] = await pool.execute(
      `SELECT ${columns} FROM menu_items WHERE is_active = 1
       AND (? IS NULL OR cafe_id = ?) AND (? IS NULL OR category = ?)
       AND LOCATE(LOWER(?), LOWER(name)) > 0 ORDER BY id`,
      [cafeId ?? null, cafeId ?? null, category ?? null, category ?? null, q.trim()],
    );
    return rows.map((row) => ({ ...row, isActive: Boolean(row.isActive) }));
  },

  async findMenuItem(id) {
    const [rows] = await pool.execute(`SELECT ${columns} FROM menu_items WHERE id = ? AND is_active = 1`, [id]);
    return rows[0] ? { ...rows[0], isActive: true } : null;
  },

  async addMenuItem(cafeId, item) {
    const [result] = await pool.execute(
      'INSERT INTO menu_items (cafe_id, name, category, description, price, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [cafeId, item.name, item.category, item.description, item.price, item.imageUrl ?? null],
    );
    return { ...item, menuItemId: result.insertId, cafeId, isActive: true };
  },

  async editMenuItem(cafeId, id, changes) {
    const fields = { name: 'name', category: 'category', description: 'description', price: 'price', imageUrl: 'image_url' };
    const entries = Object.entries(changes);
    await pool.execute(
      `UPDATE menu_items SET ${entries.map(([field]) => `${fields[field]} = ?`).join(', ')} WHERE id = ? AND cafe_id = ? AND is_active = 1`,
      [...entries.map(([, value]) => value), id, cafeId],
    );
    const item = await this.findMenuItem(id);
    return item?.cafeId === cafeId ? item : null;
  },

  async archiveMenuItem(cafeId, id) {
    const [result] = await pool.execute('UPDATE menu_items SET is_active = 0 WHERE id = ? AND cafe_id = ? AND is_active = 1', [id, cafeId]);
    return result.affectedRows > 0;
  },
};
