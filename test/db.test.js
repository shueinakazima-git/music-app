const { test } = require('node:test');
const assert = require('assert');

// This test verifies that the database helper picks up the DB_TYPE
// environment variable correctly and exposes it via the exported
// `dbType` property.  We don't actually connect to anything here.

test('db module defaults to oracle and respects DB_TYPE', () => {
  // ensure fresh load
  delete require.cache[require.resolve('../server/db')];
  process.env.DB_TYPE = '';
  const db1 = require('../server/db');
  assert.strictEqual(db1.dbType, 'oracle');

  delete require.cache[require.resolve('../server/db')];
  process.env.DB_TYPE = 'postgres';
  const db2 = require('../server/db');
  assert.strictEqual(db2.dbType, 'postgres');
});