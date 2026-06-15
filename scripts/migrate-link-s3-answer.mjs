// One-off migration: add link_s3_answer column to lms_documents
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Minimal .env loader (avoids dotenv dependency)
const env = {};
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) {
  console.error('Không đọc được .env:', e.message);
}

const conn = await mysql.createConnection({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

const DB_NAME = env.DB_NAME;

try {
  // Check if column already exists to make this idempotent
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lms_documents' AND COLUMN_NAME = 'link_s3_answer'`,
    [DB_NAME]
  );

  if (cols.length > 0) {
    console.log('✓ Cột link_s3_answer đã tồn tại, không cần migrate.');
  } else {
    await conn.query('ALTER TABLE lms_documents ADD COLUMN link_s3_answer TEXT DEFAULT NULL');
    console.log('✓ Đã thêm cột link_s3_answer vào lms_documents thành công.');
  }
} catch (err) {
  console.error('✗ Migration thất bại:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
