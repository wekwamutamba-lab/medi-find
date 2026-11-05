import { pool } from './pool';
import { QueryResult, QueryResultRow } from 'pg';

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params: any[] = [],
): Promise<T | null> {
  const res = await pool.query<T>(text, params);
  return res.rows[0] ?? null;
}
