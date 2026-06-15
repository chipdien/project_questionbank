import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// Manually parse .env file
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'question_bank',
};

async function main() {
  console.log('Connecting to database...', dbConfig.host);
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const sqlPath = path.join(__dirname, '../../docs/db/migrations/2026-06-15-dynamic-difficulty.sql');
    console.log('Reading migration file from:', sqlPath);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split queries by semicolon (simple splitter, assuming no semicolon inside strings)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);
      
    console.log(`Found ${queries.length} queries to execute.`);
    
    for (let i = 0; i < queries.length; i++) {
      console.log(`Executing query ${i + 1}/${queries.length}...`);
      await connection.query(queries[i]);
    }
    
    console.log('Migration completed successfully!');
  } catch (error: any) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
