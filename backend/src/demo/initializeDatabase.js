// อ่านไฟล์ SQL มาสร้างตาราง MySQL สำหรับแอปและชุดนำเสนอ
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';
try {
  for (const name of ['schema.sql', 'presentation.sql']) {
    const sql = await readFile(new URL('../../../database/' + name, import.meta.url), 'utf8');
    for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) await pool.query(statement);
  }
  console.log('CafeQ schema is ready.');
} finally {
  await pool.end();
}
