const db = require('../db');

//
// アルバム一覧取得
//
exports.getAllAlbums = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         a.album_id,
         a.album_name,
         a.creator_id,
         TO_CHAR(a.release_date, 'YYYY-MM-DD') AS release_date,
         c.creator_name
       FROM tbl_albums a
       JOIN tbl_creators c
         ON a.creator_id = c.creator_id
       ORDER BY a.album_name`,
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
// アルバム登録
//
exports.createAlbum = async (req, res) => {
  let conn;
  try {
    const { album_name, creator_id, release_date } = req.body || {};

    if (!album_name || !album_name.toString().trim()) {
      return res.status(400).json({ error: 'アルバム名は必須です' });
    }

    conn = await db.getConnection();

    await conn.execute(
      `INSERT INTO tbl_albums (album_name, creator_id, release_date)
       VALUES ($1, $2, $3)`,
      [album_name, creator_id, release_date]
    );

    res.json({ message: 'アルバムを登録しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// アルバム更新
//
exports.updateAlbum = async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    const { album_name, creator_id, release_date } = req.body;

    conn = await db.getConnection();

    await conn.execute(
      `UPDATE tbl_albums
       SET album_name = $1,
           creator_id = $2,
           release_date = $3
       WHERE album_id = $4`,
      [album_name, creator_id, release_date, id]
    );

    res.json({ message: 'アルバムを更新しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// アルバム削除
//
exports.deleteAlbum = async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    await conn.execute(
      `DELETE FROM tbl_albums WHERE album_id = $1`,
      [id]
    );

    res.json({ message: 'アルバムを削除しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

//
// 追加可能な楽曲取得
//
exports.getAvailableSongs = async (req, res) => {
  let conn;
  try {
    const albumId = parseInt(req.params.id, 10);
    if (Number.isNaN(albumId)) {
      return res.status(400).json({ error: 'アルバムIDが不正です' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT DISTINCT
         m.music_id,
         m.music_title,
         m.bpm,
         c.creator_name
       FROM tbl_music m
       JOIN tbl_creators c ON m.creator_id = c.creator_id
       WHERE m.music_id NOT IN (
         SELECT music_id FROM tbl_album_music WHERE album_id = $1
       )
       ORDER BY m.music_title`,
      [albumId]
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
// アルバムに楽曲追加（トランザクション対応）
//
exports.addSongsToAlbum = async (req, res) => {
  let conn;
  try {
    const albumId = parseInt(req.params.id, 10);
    if (Number.isNaN(albumId)) {
      return res.status(400).json({ error: 'アルバムIDが不正です' });
    }

    const { music_ids } = req.body;

    if (!Array.isArray(music_ids) || music_ids.length === 0) {
      return res.status(400).json({ error: '楽曲が指定されていません' });
    }

    conn = await db.getConnection();
    await conn.execute("BEGIN");

    const maxTrackResult = await conn.execute(
      `SELECT COALESCE(MAX(track_number), 0) AS max_track
       FROM tbl_album_music
       WHERE album_id = $1`,
      [albumId]
    );

    let nextTrackNumber = maxTrackResult.rows[0].max_track + 1;

    for (const musicId of music_ids) {
      await conn.execute(
        `INSERT INTO tbl_album_music (album_id, music_id, track_number)
         VALUES ($1, $2, $3)`,
        [albumId, musicId, nextTrackNumber]
      );
      nextTrackNumber++;
    }

    await conn.execute("COMMIT");

    res.json({ message: 'アルバムに楽曲を追加しました' });

  } catch (err) {
    console.error(err);
    if (conn) await conn.execute("ROLLBACK");
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};
