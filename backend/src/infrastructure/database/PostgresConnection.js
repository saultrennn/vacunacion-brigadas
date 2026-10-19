import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Lee el .env de la raíz del proyecto (~/vacunacion-brigadas/.env)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const { Pool } = pg;

class PostgresConnection {
  static #instance = null;
  #pool;

  constructor() {
    if (PostgresConnection.#instance) {
      throw new Error('Usa PostgresConnection.getInstance()');
    }
    this.#pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5433,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    this.#pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err.message);
    });
  }

  static getInstance() {
    if (!PostgresConnection.#instance) {
      PostgresConnection.#instance = new PostgresConnection();
    }
    return PostgresConnection.#instance;
  }

  query(text, params) {
    return this.#pool.query(text, params);
  }

  async transaction(fn) {
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.#pool.end();
    PostgresConnection.#instance = null;
  }
}

export default PostgresConnection;
