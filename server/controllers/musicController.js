const db = require('../db');
const oracledb = db.oracledb;

//
// 統計情報取得
//
exports.getStats = async (req, res) => {
  let conn;

  function firstValue(row) {
    if (!row) return 0;
    // try common variants
    return row.TOTAL ?? row.total ?? row.AVG_BPM ?? row.avg_bpm ?? Object.values(row)[0] ?? 0;
  }

  try {
    conn = await db.getConnection();

    const totalSongs = await conn.execute(
      `SELECT COUNT(*) AS TOTAL FROM tbl_music`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const totalCreators = await conn.execute(
      `SELECT COUNT(*) AS TOTAL FROM tbl_creators`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const avgBpm = await conn.execute(
      `SELECT ROUND(AVG(bpm),1) AS AVG_BPM FROM tbl_music`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const ts = totalSongs.rows && totalSongs.rows[0] ? firstValue(totalSongs.rows[0]) : 0;
    const tc = totalCreators.rows && totalCreators.rows[0] ? firstValue(totalCreators.rows[0]) : 0;
    const ab = avgBpm.rows && avgBpm.rows[0] ? firstValue(avgBpm.rows[0]) : 0;

    res.json({
      totalSongs: Number(ts) || 0,
      totalCreators: Number(tc) || 0,
      avgBpm: Number(ab) || 0
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
        c.creator_name
      FROM tbl_music m
      JOIN tbl_creators c
        ON m.creator_id = c.creator_id
    `;

    let binds = {};

    if (creatorId) {
      sql += " WHERE m.creator_id = :creatorId";
      binds.creatorId = creatorId;
    }

    const result = await conn.execute(
      sql,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // normalize column keys to UPPERCASE so front-end code (which expects
    // fields like MUSIC_TITLE, CREATOR_NAME) keeps working across DB drivers
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

//
// クリエイター一覧
//
exports.getCreators = async (req, res) => {
  let conn;

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT creator_id, creator_name FROM tbl_creators`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
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
       VALUES (:title, :creator_id, :bpm, :musical_key, :duration_seconds)`,
      { title, creator_id, bpm, musical_key, duration_seconds },
      { autoCommit: true }
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
       SET music_title = :title,
           bpm = :bpm,
           musical_key = :musical_key,
           duration_seconds = :duration_seconds
       WHERE music_id = :id`,
      { title, bpm, musical_key, duration_seconds, id },
      { autoCommit: true }
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
    conn = await getConnection();

    await conn.execute(
      `DELETE FROM tbl_music WHERE music_id = :id`,
      { id },
      { autoCommit: true }
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
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    conn = await db.getConnection();

    const sql = `
      SELECT
        cp.absolute_tick,
        c.chord_name
      FROM tbl_chord_progression cp
      LEFT JOIN tbl_chords c
        ON cp.chord_id = c.chord_id
      WHERE cp.music_id = :id
      ORDER BY cp.absolute_tick
    `;

    const result = await conn.execute(
      sql,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows || []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = exports;
