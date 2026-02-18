const oracledb = require('oracledb');
const { getConnection } = require('../db');

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
    if (conn) {
      await conn.close();
    }
  }
};

exports.getAllMusic = async (req, res) => {
  try {
    const conn = await getConnection();

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
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );

    await conn.close();
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCreators = async (req, res) => {
  try {
    const conn = await getConnection();

    const result = await conn.execute(
      `SELECT creator_id, creator_name
       FROM tbl_creators`,
      [],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );

    await conn.close();
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.createMusic = async (req, res) => {
  try {
    const { title, creator_id, bpm, musical_key, duration_seconds } = req.body;
    const conn = await getConnection();

    await conn.execute(
      `INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
       VALUES (:title, :creator_id, :bpm, :musical_key, :duration_seconds)`,
      { title, creator_id, bpm, musical_key, duration_seconds },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Inserted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateMusic = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, bpm, musical_key, duration_seconds } = req.body;

    const conn = await getConnection();

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

    await conn.close();
    res.json({ message: "Updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMusic = async (req, res) => {
  try {
    const id = req.params.id;
    const conn = await getConnection();

    await conn.execute(
      `DELETE FROM tbl_music WHERE music_id = :id`,
      { id },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
  
};
