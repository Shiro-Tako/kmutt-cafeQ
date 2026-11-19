import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';
try {
  const sql = await readFile(new URL('../../../database/schema.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
    await pool.query(statement);
  }
  console.log('CafeQ schema is ready.');
} finally {
  await pool.end();
}
