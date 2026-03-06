const { test } = require('node:test');
const assert = require('assert');
const { withMockedDb } = require('../test-utils/withMockedDb');

test('getChordProgression returns 400 for invalid id', async (t) => {
  await withMockedDb(null, 'musicController', async (controller) => {
    const req = { params: { id: 'abc' } };
    const res = {
      status(code) { this._status = code; return this; },
      json(obj) { this._json = obj; }
    };

    await controller.getChordProgression(req, res);

    assert.strictEqual(res._status, 400);
    assert.deepStrictEqual(res._json, { error: 'IDが不正です' });
  });
});

test('getChordProgression returns rows from DB', async (t) => {
  const fakeRows = [{ absolute_tick: 0, chord_name: 'C' }];
  const mockConn = {
    execute: async () => ({ rows: fakeRows }),
    close: async () => {}
  };

  await withMockedDb(mockConn, 'musicController', async (controller) => {
    const req = { params: { id: '1' } };
    const res = {
      status(code) { this._status = code; return this; },
      json(obj) { this._json = obj; }
    };

    await controller.getChordProgression(req, res);

    assert.strictEqual(res._status, undefined);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});

test('getAllMusic returns rows with creator filter', async (t) => {
  const fakeRows = [{ music_id: 1, music_title: 'Song', bpm: 120, creator_name: 'Alice' }];
  const mockConn = {
    execute: async () => ({ rows: fakeRows }),
    close: async () => {}
  };

  await withMockedDb(mockConn, 'musicController', async (controller) => {
    const req = { query: { creator_id: '2' } };
    const res = {
      status(code) { this._status = code; return this; },
      json(obj) { this._json = obj; }
    };

    await controller.getAllMusic(req, res);

    assert.deepStrictEqual(res._json, fakeRows);
  });
});
