const db = require('../db'); // ← 既存DB接続と合わせる

exports.getChordProgression = async (req, res) => {
  const musicId = req.params.id;

  try {
    const result = await db.execute(
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
      { music_id: musicId }
    );

    res.json(
      result.rows.map(row => ({
        ABSOLUTE_TICK: row[0],
        CHORD_NAME: row[1]
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
};
