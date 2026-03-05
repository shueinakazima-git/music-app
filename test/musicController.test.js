const { test } = require('node:test');
const assert = require('assert');

// helper to require controller with mocked db module
function withMockedDb(mockConn, fn) {
  const dbPath = require.resolve('../server/db');
  const ctrlPath = require.resolve('../server/controllers/musicController');

  const origDb = require.cache[dbPath];
  const origCtrl = require.cache[ctrlPath];

  // put mock db into cache
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { getConnection: async () => mockConn, oracledb: { OUT_FORMAT_OBJECT: 1, BIND_OUT: 2002, NUMBER: 2 } } };

  // remove controller so it will re-require and pick up mock
  delete require.cache[ctrlPath];
  const controller = require('../server/controllers/musicController');

  const run = async () => {
    try {
      await fn(controller);
    } finally {
      // restore
      if (origDb) require.cache[dbPath] = origDb; else delete require.cache[dbPath];
      if (origCtrl) require.cache[ctrlPath] = origCtrl; else delete require.cache[ctrlPath];
    }
  };

  return run();
}

function makeRes() {
  let statusCode = 200;
  return {
    status(code) { statusCode = code; return this; },
    json: (payload) => { res.payload = payload; res.statusCode = statusCode; },
  };
}

test('getChordProgression returns 400 for invalid id', async (t) => {
  await withMockedDb(null, async (controller) => {
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

  await withMockedDb(mockConn, async (controller) => {
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

  await withMockedDb(mockConn, async (controller) => {
    const req = { query: { creator_id: '2' } };
    const res = {
      status(code) { this._status = code; return this; },
      json(obj) { this._json = obj; }
    };

    await controller.getAllMusic(req, res);

    assert.deepStrictEqual(res._json, fakeRows);
  });
});
