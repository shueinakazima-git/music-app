const oracledb = require('oracledb');
const { getConnection } = require('../db');

//
// 統計情報取得
//
exports.getStats = async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

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

    res.json({
      totalSongs: totalSongs.rows[0].TOTAL,
      totalCreators: totalCreators.rows[0].TOTAL,
      avgBpm: avgBpm.rows[0].AVG_BPM || 0
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
    conn = await getConnection();

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
    conn = await getConnection();

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
    conn = await getConnection();

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

    conn = await getConnection();

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
  console.log("getChordProgression called");

  let conn;

  try {
    const id = Number(req.params.id);
    console.log("music id =", id, typeof id);

    conn = await getConnection();

    const check = await conn.execute(
      `SELECT COUNT(*) CNT
        FROM tbl_chord_progression
        WHERE music_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("COUNT =", check.rows);


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

    console.log("SQL =", sql);
    console.log("bind =", id);

    const userCheck = await conn.execute(
      `SELECT USER FROM dual`
    );

    console.log("DB USER =", userCheck.rows[0][0]);

    const pdbCheck = await conn.execute(
      `SELECT sys_context('userenv','con_name') FROM dual`
    );

    console.log("CON_NAME =", pdbCheck.rows[0][0]);

    const dbCheck = await conn.execute(
      `SELECT dbid, name FROM v$database`
    );

    console.log("DB =", dbCheck.rows);

    const m = await conn.execute(
  `SELECT COUNT(*) CNT FROM tbl_music`,
  [],
  { outFormat: oracledb.OUT_FORMAT_OBJECT }
);

console.log("MUSIC COUNT =", m.rows);


    const result = await conn.execute(
      `
      SELECT
        cp.absolute_tick,
        c.chord_name
      FROM tbl_chord_progression cp
      LEFT JOIN tbl_chords c
        ON cp.chord_id = c.chord_id
      WHERE cp.music_id = 1
      ORDER BY cp.absolute_tick
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("rows =", result.rows);


    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = exports;
