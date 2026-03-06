// server/db.js
// PostgreSQL専用版（Oracle関連コードは完全削除）

const { Pool } = require('pg');

let pgPool;

async function getConnection() {
  if (!pgPool) {
    pgPool = new Pool({
      user: process.env.PG_USER || process.env.DB_USER,
      password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
      host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
      port: process.env.PG_PORT || process.env.DB_PORT || 5432,
      database: process.env.PG_DATABASE || process.env.DB_DATABASE || 'postgres'
    });
  }

  const client = await pgPool.connect();

  return {
    /**
     * execute(sql, binds)
     * - sql: $1, $2 形式を使用すること
     * - binds: 必ず配列で渡すこと
     */
    execute: async (sql, binds = []) => {
      if (!Array.isArray(binds)) {
        throw new Error('PostgreSQL requires bind values to be an array');
      }

      const result = await client.query(sql, binds);

      return {
        rows: result.rows,
        rowCount: result.rowCount
      };
    },

    // Postgresは自動コミットなので何もしない
    commit: async () => {},

    close: async () => {
      client.release();
    }
  };
}

module.exports = {
  getConnection
};