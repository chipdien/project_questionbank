const pool = require('../src/lib/db').default;

async function migrate() {
  try {
    console.log('Adding column is_ai_classified to lms_documents...');
    await pool.execute(`
      ALTER TABLE lms_documents 
      ADD COLUMN IF NOT EXISTS is_ai_classified TINYINT(1) DEFAULT 0;
    `);
    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    // Nếu IF NOT EXISTS không phải SQL chuẩn của MySQL cũ, thử catch lỗi
    if (error.message.includes('Duplicate column name')) {
        console.log('Column already exists.');
        process.exit(0);
    }
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
