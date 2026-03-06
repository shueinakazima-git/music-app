const { test } = require('node:test');
const assert = require('assert');
const { withMockedDb } = require('../test-utils/withMockedDb');

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

test('tagController.createTag returns 409 for duplicate active tag', async () => {
  const mockConn = {
    execute: async () => ({ rows: [{ tag_id: 7, deleted_at: null }] }),
    close: async () => {}
  };

  await withMockedDb(mockConn, 'tagController', async (controller) => {
    const req = { body: { tag_name: 'Rock', note: null } };
    const res = makeRes();
    await controller.createTag(req, res);

    assert.strictEqual(res._status, 409);
    assert.strictEqual(res._json.error, '同名のタグが既に存在します');
    assert.strictEqual(res._json.tag_id, 7);
  });
});

test('tagController.createTag restores soft-deleted tag', async () => {
  let call = 0;
  const mockConn = {
    execute: async () => {
      call += 1;
      if (call === 1) {
        return { rows: [{ tag_id: 9, deleted_at: '2026-01-01' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    close: async () => {}
  };

  await withMockedDb(mockConn, 'tagController', async (controller) => {
    const req = { body: { tag_name: 'Pop', note: 'restored' } };
    const res = makeRes();
    await controller.createTag(req, res);

    assert.strictEqual(res._status, 200);
    assert.strictEqual(res._json.message, 'タグを復元しました');
    assert.strictEqual(res._json.tag_id, 9);
    assert.strictEqual(res._json.tag_name, 'Pop');
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

// verify createCreator works for postgres-style returning

test('creatorController.createCreator handles postgres-style returning', async () => {
  const fakeResult = { rows: [{ creator_id: 123 }] };
  const mockConn = {
    execute: async () => fakeResult,
    close: async () => {},
    commit: async () => {}
  };

  // instruct the mocked db to report postgres type
  await withMockedDb(mockConn, 'creatorController', async (controller) => {
    const req = { body: { creator_name: 'Eve', creator_type: 'GROUP' } };
    const res = makeRes();
    await controller.createCreator(req, res);
    assert.strictEqual(res._json.creator_id, 123);
  }, { dbType: 'postgres' });
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
