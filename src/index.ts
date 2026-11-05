import app from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const port = env.PORT;
const server = app.listen(port, () => {
  console.log(`MediFind AI backend listening on port ${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => pool.end());
});
process.on('SIGINT', () => {
  server.close(() => pool.end());
});
