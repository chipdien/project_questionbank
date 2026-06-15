import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Executes a raw MySQL query.
 * @param sql The SQL query string
 * @param params Optional parameters for the query
 * @returns The query result
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  try {
    const [results] = await pool.query(sql, params);
    return results as T;
  } catch (error: any) {
    console.error('Database query error:', error.message);
    throw new Error(`Database Error: ${error.message}`);
  }
}

export default pool;
