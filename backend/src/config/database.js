const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DATABASE_HOST || process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.DATABASE_PORT || process.env.PGPORT || 5432),
        database: process.env.DATABASE_NAME || process.env.PGDATABASE || 'lotusandlion',
        user: process.env.DATABASE_USER || process.env.PGUSER || 'postgres',
        password: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client', err);
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Query]', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

module.exports = {
  pool,
  query,
};
