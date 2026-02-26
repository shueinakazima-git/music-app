const { test } = require('node:test');
const assert = require('assert');
const db = require('../server/db');

if (db.dbType === 'postgres') {
  test('convertSqlForPostgres translates named binds to $1 etc', () => {
    const { text, values } = db._convertSqlForPostgres(
      'SELECT * FROM tbl WHERE a = :a AND b = :b',
      { a: 1, b: 2 }
    );
    assert.strictEqual(text, 'SELECT * FROM tbl WHERE a = $1 AND b = $2');
    assert.deepStrictEqual(values, [1, 2]);
  });
} else {
  test('convertSqlForPostgres leaves SQL untouched when not postgres', () => {
    const { text, values } = db._convertSqlForPostgres('foo', { foo: 'bar' });
    assert.strictEqual(text, 'foo');
    // the helper still returns an array of values based on the binds
    assert.deepStrictEqual(values, ['bar']);
  });
}