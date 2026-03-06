const { test } = require('node:test');
const assert = require('assert');
const db = require('../server/db');
const { Pool } = require('pg');

test('db.execute rejects non-array bind values', async () => {
  const originalConnect = Pool.prototype.connect;

  Pool.prototype.connect = async function connectMock() {
    return {
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => {}
    };
  };

  try {
    const conn = await db.getConnection();

    await assert.rejects(
      () => conn.execute('SELECT 1', { not: 'array' }),
      /bind values to be an array/
    );

    await conn.close();
  } finally {
    Pool.prototype.connect = originalConnect;
  }
});
