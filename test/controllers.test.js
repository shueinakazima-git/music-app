const { test } = require('node:test');
const assert = require('assert');

function withMockedDb(mockConn, controllerRelPath, fn) {
  const dbPath = require.resolve('../server/db');
  const ctrlPath = require.resolve(`../server/controllers/${controllerRelPath}`);

  const origDb = require.cache[dbPath];
  const origCtrl = require.cache[ctrlPath];

  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { getConnection: async () => mockConn, oracledb: { OUT_FORMAT_OBJECT: 1, BIND_OUT: 2002, NUMBER: 2 } } };

  delete require.cache[ctrlPath];
  const controller = require(`../server/controllers/${controllerRelPath}`);

  const run = async () => {
    try {
      await fn(controller);
    } finally {
      if (origDb) require.cache[dbPath] = origDb; else delete require.cache[dbPath];
      if (origCtrl) require.cache[ctrlPath] = origCtrl; else delete require.cache[ctrlPath];
    }
  };

  return run();
}

function makeRes() {
  return {
    status(code) { this._status = code; return this; },
    json(obj) { this._json = obj; }
  };
}

test('chordController.getChordProgression returns rows', async () => {
  const fakeRows = [{ absolute_tick: 0, chord_name: 'C' }];
  const mockConn = { execute: async () => ({ rows: fakeRows }), close: async () => {} };

  await withMockedDb(mockConn, 'chordController', async (controller) => {
    const req = { params: { id: '1' } };
    const res = makeRes();
    await controller.getChordProgression(req, res);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});

test('albumController.getAvailableSongs returns rows', async () => {
  const fakeRows = [{ music_id: 10, music_title: 'Song' }];
  const mockConn = { execute: async () => ({ rows: fakeRows }), close: async () => {} };

  await withMockedDb(mockConn, 'albumController', async (controller) => {
    const req = { params: { id: '5' } };
    const res = makeRes();
    await controller.getAvailableSongs(req, res);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});

test('tagController.getAllTags returns rows', async () => {
  const fakeRows = [{ TAG_ID: 1, TAG_NAME: 'tag' }];
  const mockConn = { execute: async () => ({ rows: fakeRows }), close: async () => {} };

  await withMockedDb(mockConn, 'tagController', async (controller) => {
    const req = {};
    const res = makeRes();
    await controller.getAllTags(req, res);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});

test('creatorController.getAllCreators returns rows', async () => {
  const fakeRows = [{ creator_id: 1, creator_name: 'Alice' }];
  const mockConn = { execute: async () => ({ rows: fakeRows }), close: async () => {} };

  await withMockedDb(mockConn, 'creatorController', async (controller) => {
    const req = {};
    const res = makeRes();
    await controller.getAllCreators(req, res);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});

test('artistController.getAllArtists returns rows', async () => {
  const fakeRows = [{ ARTIST_ID: 1 }];
  const mockConn = { execute: async () => ({ rows: fakeRows }), close: async () => {} };

  await withMockedDb(mockConn, 'artistController', async (controller) => {
    const req = {};
    const res = makeRes();
    await controller.getAllArtists(req, res);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});

test('groupController.getAllGroups returns rows', async () => {
  const fakeRows = [{ GROUP_ID: 2 }];
  const mockConn = { execute: async () => ({ rows: fakeRows }), close: async () => {} };

  await withMockedDb(mockConn, 'groupController', async (controller) => {
    const req = {};
    const res = makeRes();
    await controller.getAllGroups(req, res);
    assert.deepStrictEqual(res._json, fakeRows);
  });
});
