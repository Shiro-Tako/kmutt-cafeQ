import { pool } from '../config/database.js';

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id AS userId, name, email, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  return rows[0] ?? null;
}

async function registerUser({ name, email, passwordHash, tokenHash, expiresAt }) {
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    );
    await connection.execute(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
      [tokenHash, result.insertId, expiresAt],
    );
    await connection.commit();
    return { userId: result.insertId, name, email };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createSession({ userId, tokenHash, expiresAt }) {
  await pool.execute(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [tokenHash, userId, expiresAt],
  );
}

async function findUserBySessionHash(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT u.id AS userId, u.name, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [tokenHash],
  );
  if (!rows[0]) return null;

  const [staffRows] = await pool.execute(
    'SELECT cafe_id AS cafeId FROM cafe_staff WHERE user_id = ? ORDER BY cafe_id',
    [rows[0].userId],
  );
  return {
    ...rows[0],
    staffCafeIds: staffRows.map(({ cafeId }) => cafeId),
  };
}

async function deleteSession(tokenHash) {
  await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
}

export const mysqlAuthRepository = {
  findUserByEmail,
  registerUser,
  createSession,
  findUserBySessionHash,
  deleteSession,
};
