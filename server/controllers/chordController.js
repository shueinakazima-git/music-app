const db = require('../db');
const oracledb = db.oracledb;

exports.getChordProgression = async (req, res) => {
  let conn;
  try {
    const musicId = Number(req.params.id);
    if (Number.isNaN(musicId)) return res.status(400).json({ error: 'Invalid id' });

    conn = await db.getConnection();

    const result = await conn.execute(
      `
      SELECT
          cp.absolute_tick,
          c.chord_name
      FROM tbl_chord_progression cp
      JOIN tbl_chords c
        ON cp.chord_id = c.chord_id
      WHERE cp.music_id = :music_id
      ORDER BY cp.absolute_tick
      `,
      { music_id: musicId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await conn.close();

    res.json(result.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB error');
  } finally {
    if (conn) await conn.close();
  }
};
