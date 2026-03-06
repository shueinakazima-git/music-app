const db = require('../db');

exports.getChordProgression = async (req, res) => {
  let conn;

  try {
    const musicId = Number(req.params.id);
    if (Number.isNaN(musicId)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `
      SELECT
          cp.absolute_tick,
          c.chord_name
      FROM tbl_chord_progression cp
      JOIN tbl_chords c
        ON cp.chord_id = c.chord_id
      WHERE cp.music_id = $1
      ORDER BY cp.absolute_tick
      `,
      [musicId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'データベースエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};
