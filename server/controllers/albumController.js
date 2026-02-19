const db = require('../db');
const oracledb = db.oracledb;

exports.getAllAlbums = async (req, res) => {
  try {
    const conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         a.album_id,
         a.album_name,
         a.creator_id,
         a.release_date,
         c.creator_name
       FROM tbl_albums a
       JOIN tbl_creators c
         ON a.creator_id = c.creator_id
       ORDER BY a.album_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await conn.close();

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.createAlbum = async (req, res) => {
  try {
    const { album_name, creator_id, release_date } = req.body || {};

    if (!album_name || !album_name.toString().trim()) {
      return res.status(400).json({ error: 'album_name is required' });
    }

    const conn = await db.getConnection();

    await conn.execute(
      `INSERT INTO tbl_albums (album_name, creator_id, release_date)
       VALUES (:album_name, :creator_id, :release_date)`,
      { album_name, creator_id, release_date },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Album inserted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { album_name, creator_id, release_date } = req.body;

    const conn = await db.getConnection();

    await conn.execute(
      `UPDATE tbl_albums
       SET album_name = :album_name,
           creator_id = :creator_id,
           release_date = :release_date
       WHERE album_id = :id`,
      { album_name, creator_id, release_date, id },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Album updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const conn = await db.getConnection();

    await conn.execute(
      `DELETE FROM tbl_albums WHERE album_id = :id`,
      { id },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Album deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableSongs = async (req, res) => {
  try {
    const albumId = parseInt(req.params.id, 10);
    if (Number.isNaN(albumId)) {
      return res.status(400).json({ error: 'invalid album id' });
    }

    const conn = await db.getConnection();

    // そのアルバムに追加されていない曲を取得
    const result = await conn.execute(
      `SELECT DISTINCT
         m.music_id,
         m.music_title,
         m.bpm,
         c.creator_name
       FROM tbl_music m
       JOIN tbl_creators c ON m.creator_id = c.creator_id
       WHERE m.music_id NOT IN (
         SELECT music_id FROM tbl_album_music WHERE album_id = :albumId
       )
       ORDER BY m.music_title`,
      { albumId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await conn.close();
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.addSongsToAlbum = async (req, res) => {
  try {
    const albumId = parseInt(req.params.id, 10);
    if (Number.isNaN(albumId)) {
      return res.status(400).json({ error: 'invalid album id' });
    }

    const { music_ids } = req.body;

    if (!Array.isArray(music_ids) || music_ids.length === 0) {
      return res.status(400).json({ error: "No songs provided" });
    }

    const conn = await db.getConnection();

    // 現在のアルバムの最大track_numberを取得
    const maxTrackResult = await conn.execute(
      `SELECT MAX(track_number) as max_track FROM tbl_album_music WHERE album_id = :albumId`,
      { albumId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let nextTrackNumber = 1;
    if (maxTrackResult.rows[0].MAX_TRACK) {
      nextTrackNumber = maxTrackResult.rows[0].MAX_TRACK + 1;
    }

    // 各曲をアルバムに追加
    for (const musicId of music_ids) {
      await conn.execute(
        `INSERT INTO tbl_album_music (album_id, music_id, track_number)
         VALUES (:albumId, :musicId, :trackNumber)`,
        { albumId, musicId, trackNumber: nextTrackNumber },
        { autoCommit: true }
      );
      nextTrackNumber++;
    }

    await conn.close();
    res.json({ message: "Songs added to album successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
