// server/db.js
// This module abstracts the database driver so that the rest of the
// application can use a simple `execute`/`close` interface.  Depending on
// the environment variable `DB_TYPE` it will either talk to Oracle or
// PostgreSQL.  The default is Oracle for backwards compatibility.

// supported types: 'oracle', 'postgres'
const dbType = (process.env.DB_TYPE || 'oracle').toLowerCase();

let oracledb;
if (dbType === 'oracle') {
  oracledb = require('oracledb');
} else {
  // make a small stub so code that references oracledb constants still works
  oracledb = {
    OUT_FORMAT_OBJECT: 1,
    BIND_OUT: 2002,
    NUMBER: 2
  };
}

// PostgreSQL client/pool
let pgPool;
const { Pool } = require('pg');

function convertSqlForPostgres(sql, binds) {
  // simple converter that replaces Oracle-style named binds (":name")
  // with PostgreSQL positional parameters ($1, $2, ...)
  let text = sql;
  const values = [];

  if (binds && typeof binds === 'object' && !Array.isArray(binds)) {
    let idx = 1;
    for (const key of Object.keys(binds)) {
      const regex = new RegExp(':' + key + '\\b', 'g');
      text = text.replace(regex, () => '$' + idx++);
      values.push(binds[key]);
    }
  } else if (Array.isArray(binds)) {
    // assume the caller passed positional array; just replace any "?" placeholders
    text = text.replace(/\?/g, () => '$' + values.length + 1);
    values.push(...binds);
  }

  return { text, values };
}

async function getConnection() {
  if (dbType === 'postgres') {
    // lazily create pool
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
      execute: async (sql, binds = [], options = {}) => {
        const { text, values } = convertSqlForPostgres(sql, binds);
        const result = await client.query(text, values);
        return { rows: result.rows };
      },
      commit: async () => {
        // PostgreSQL client auto-commits single statements; no action needed
      },
      close: async () => {
        client.release();
      }
    };
  }

  // fall back to Oracle
  const user = process.env.DB_USER || 'system';
  const password = process.env.DB_PASSWORD;
  const connectString = process.env.DB_CONNECT_STRING || 'localhost/FREEPDB1';

  if (!password) {
    throw new Error('DB_PASSWORD environment variable is not set');
  }

  const conn = await oracledb.getConnection({
    user,
    password,
    connectString
  });

  // wrap to keep interface similar between drivers
  return {
    execute: (sql, binds = [], options = {}) => conn.execute(sql, binds, options),
    close: () => conn.close()
  };
}

module.exports = {
  getConnection,
  oracledb,
  dbType,
  // exposed for unit tests
  _convertSqlForPostgres: convertSqlForPostgres
};
