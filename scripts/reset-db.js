const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await pool.query('DELETE FROM stock_movements');
    await pool.query('DELETE FROM batches');
    await pool.query('DELETE FROM medicines');
    await pool.query('DELETE FROM profiles');
    console.log('database reset');
  } finally {
    await pool.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
