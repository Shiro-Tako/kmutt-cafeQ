import { pool } from '../config/database.js';

const favoriteColumns = `
  mi.id AS menuItemId,
  mi.cafe_id AS cafeId,
  mi.name,
  mi.category,
  mi.description,
  mi.price,
  mi.image_url AS imageUrl,
  mi.is_active AS isActive
`;

export const mysqlFavoritesRepository = {
  async listForUser(userId) {
    const [rows] = await pool.execute(
      `SELECT ${favoriteColumns}
       FROM favorites f
       JOIN menu_items mi ON mi.id = f.menu_item_id
       WHERE f.user_id = ? AND mi.is_active = 1
       ORDER BY mi.id`,
      [userId],
    );
    return rows.map((row) => ({ ...row, isActive: Boolean(row.isActive) }));
  },

  async addForUser(userId, menuItemId) {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [rows] = await connection.execute(
        'SELECT is_active AS isActive FROM menu_items WHERE id = ? FOR UPDATE',
        [menuItemId],
      );
      if (!rows[0]) {
        await connection.rollback();
        transactionStarted = false;
        return 'not_found';
      }
      if (!rows[0].isActive) {
        await connection.rollback();
        transactionStarted = false;
        return 'unavailable';
      }
      await connection.execute(
        'INSERT IGNORE INTO favorites (user_id, menu_item_id) VALUES (?, ?)',
        [userId, menuItemId],
      );
      await connection.commit();
      transactionStarted = false;
      return 'saved';
    } catch (error) {
      if (transactionStarted) await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async removeForUser(userId, menuItemId) {
    await pool.execute(
      'DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?',
      [userId, menuItemId],
    );
  },
};
