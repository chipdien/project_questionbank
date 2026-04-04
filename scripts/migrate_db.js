const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'abcd1234',
    database: 'question_bank',
  });

  try {
    console.log('Adding column is_ai_classified to lms_documents...');
    await connection.execute(`
      ALTER TABLE lms_documents 
      ADD COLUMN is_ai_classified TINYINT(1) DEFAULT 0;
    `);
    console.log('Migration successful!');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('Column already exists.');
    } else {
      console.error('Migration failed:', error.message);
    }
  } finally {
    await connection.end();
  }
}

migrate();

