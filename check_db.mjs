
import db from './src/lib/db.ts';

async function checkDb() {
  try {
    const results = await db.query('SELECT id, title, content_hash FROM lms_documents_custom');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkDb();
