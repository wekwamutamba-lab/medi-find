import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';

const connectionString =
  process.env.NODE_ENV === 'test' && process.env.DATABASE_URL_TEST
    ? process.env.DATABASE_URL_TEST
    : env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err);
});
