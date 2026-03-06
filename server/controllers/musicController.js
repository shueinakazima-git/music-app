const db = require('../db');
const { fetchAllCreators } = require('../services/creatorService');
//
// クリエイター一覧
//
exports.getCreators = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const creators = await fetchAllCreators(conn);
    res.json(creators);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};
//
// 統計情報取得
//
exports.getStats = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const [totalAlbums, totalSongs, totalCreators, totalGroups, totalArtists] = await Promise.all([
      conn.execute(`SELECT COUNT(*)::int AS total FROM tbl_albums`, []),
      conn.execute(`SELECT COUNT(*)::int AS total FROM tbl_music`, []),
      conn.execute(`SELECT COUNT(*)::int AS total FROM tbl_creators`, []),
      conn.execute(`SELECT COUNT(*)::int AS total FROM tbl_groups`, []),
      conn.execute(`SELECT COUNT(*)::int AS total FROM tbl_artists`, [])
    ]);

    res.json({
      totalAlbums: totalAlbums.rows[0]?.total || 0,
      totalSongs: totalSongs.rows[0]?.total || 0,
      totalCreators: totalCreators.rows[0]?.total || 0,
      totalGroups: totalGroups.rows[0]?.total || 0,
      totalArtists: totalArtists.rows[0]?.total || 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 全楽曲取得
//
exports.getAllMusic = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const creatorId = req.query.creator_id;

    let sql = `
      SELECT
        m.music_id,
        m.music_title,
        m.bpm,
        m.musical_key,
        m.duration_seconds,
        c.creator_name,
        a.album_name,
        t.tag_name
      FROM tbl_music m
      JOIN tbl_creators c ON m.creator_id = c.creator_id
      LEFT JOIN tbl_album_music am ON m.music_id = am.music_id
      LEFT JOIN tbl_albums a ON am.album_id = a.album_id
      LEFT JOIN tbl_music_tags mt ON m.music_id = mt.music_id
      LEFT JOIN tbl_tags t ON mt.tag_id = t.tag_id
    `;

    const binds = [];

    if (creatorId) {
      sql += ` WHERE m.creator_id = $1`;
      binds.push(creatorId);
    }

    const result = await conn.execute(sql, binds);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// コード進行が登録されている楽曲のみ取得
//
exports.getMusicWithChords = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT DISTINCT
         m.music_id,
         m.music_title,
         c.creator_name
       FROM tbl_music m
       JOIN tbl_creators c
         ON m.creator_id = c.creator_id
       WHERE EXISTS (
         SELECT 1
         FROM tbl_chord_progression cp
         WHERE cp.music_id = m.music_id
       )
       ORDER BY m.music_title`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 楽曲登録
//
exports.createMusic = async (req, res) => {
  let conn;
  try {
    const { title, creator_id, bpm, musical_key, duration_seconds } = req.body;

    conn = await db.getConnection();

    await conn.execute(
      `INSERT INTO tbl_music
       (music_title, creator_id, bpm, musical_key, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, creator_id, bpm, musical_key, duration_seconds]
    );

    res.json({ message: '楽曲を登録しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 楽曲更新
//
exports.updateMusic = async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    const { title, bpm, musical_key, duration_seconds } = req.body;

    conn = await db.getConnection();

    await conn.execute(
      `UPDATE tbl_music
       SET music_title = $1,
           bpm = $2,
           musical_key = $3,
           duration_seconds = $4
       WHERE music_id = $5`,
      [title, bpm, musical_key, duration_seconds, id]
    );

    res.json({ message: '楽曲を更新しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 楽曲削除
//
exports.deleteMusic = async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);

    conn = await db.getConnection();

    await conn.execute(
      `DELETE FROM tbl_music WHERE music_id = $1`,
      [id]
    );

    res.json({ message: '楽曲を削除しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// コード進行取得
//
exports.getChordProgression = async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         cp.absolute_tick,
         c.chord_name
       FROM tbl_chord_progression cp
       LEFT JOIN tbl_chords c ON cp.chord_id = c.chord_id
       WHERE cp.music_id = $1
       ORDER BY cp.absolute_tick`,
      [id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 曲に紐付け可能なタグ一覧取得
//
exports.getMusicTags = async (req, res) => {
  let conn;
  try {
    const musicId = Number(req.params.id);
    if (Number.isNaN(musicId)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         t.tag_id,
         t.tag_name,
         t.note
       FROM tbl_music_tags mt
       JOIN tbl_tags t
         ON mt.tag_id = t.tag_id
       WHERE mt.music_id = $1
         AND t.deleted_at IS NULL
       ORDER BY t.tag_name`,
      [musicId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 曲に紐付け可能なタグ一覧取得
//
exports.getAvailableTags = async (req, res) => {
  let conn;
  try {
    const musicId = Number(req.params.id);
    if (Number.isNaN(musicId)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         t.tag_id,
         t.tag_name,
         t.note
       FROM tbl_tags t
       WHERE t.deleted_at IS NULL
         AND t.tag_id NOT IN (
           SELECT mt.tag_id
           FROM tbl_music_tags mt
           WHERE mt.music_id = $1
         )
       ORDER BY t.tag_name`,
      [musicId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 曲にタグを紐付け
//
exports.addTagsToMusic = async (req, res) => {
  let conn;
  try {
    const musicId = Number(req.params.id);
    if (Number.isNaN(musicId)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    const { tag_ids } = req.body || {};
    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({ error: 'タグが指定されていません' });
    }

    const uniqueTagIds = [...new Set(tag_ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)))];
    if (uniqueTagIds.length === 0) {
      return res.status(400).json({ error: 'タグが指定されていません' });
    }

    conn = await db.getConnection();
    await conn.execute('BEGIN');

    for (const tagId of uniqueTagIds) {
      await conn.execute(
        `INSERT INTO tbl_music_tags (music_id, tag_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (music_id, tag_id) DO NOTHING`,
        [musicId, tagId]
      );
    }

    await conn.execute('COMMIT');

    res.json({ message: '曲にタグを紐付けました' });

  } catch (err) {
    console.error(err);
    if (conn) await conn.execute('ROLLBACK');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 曲からタグを紐付け解除
//
exports.removeTagFromMusic = async (req, res) => {
  let conn;
  try {
    const musicId = Number(req.params.musicId);
    const tagId = Number(req.params.tagId);
    if (Number.isNaN(musicId) || Number.isNaN(tagId)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `DELETE FROM tbl_music_tags
       WHERE music_id = $1
         AND tag_id = $2`,
      [musicId, tagId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '紐付けが見つかりません' });
    }

    res.json({ message: 'タグの紐付けを解除しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = exports;
