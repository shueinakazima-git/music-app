const db = require('../db');
//
// クリエイター一覧
//
exports.getCreators = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT creator_id, creator_name, creator_type
       FROM tbl_creators
       ORDER BY creator_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

    const totalSongs = await conn.execute(
      `SELECT COUNT(*)::int AS total FROM tbl_music`,
      []
    );

    const totalCreators = await conn.execute(
      `SELECT COUNT(*)::int AS total FROM tbl_creators`,
      []
    );

    const avgBpm = await conn.execute(
      `SELECT ROUND(AVG(bpm),1) AS avg_bpm FROM tbl_music`,
      []
    );

    res.json({
      totalSongs: totalSongs.rows[0]?.total || 0,
      totalCreators: totalCreators.rows[0]?.total || 0,
      avgBpm: Number(avgBpm.rows[0]?.avg_bpm) || 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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

    res.json({ message: "Inserted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

    res.json({ message: "Updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
      return res.status(400).json({ error: 'Invalid id' });
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
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = exports;
