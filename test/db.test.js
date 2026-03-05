const { test } = require('node:test');
const assert = require('assert');

test('db module exports getConnection', () => {
  delete require.cache[require.resolve('../server/db')];
  const db = require('../server/db');

  assert.strictEqual(typeof db.getConnection, 'function');
});
