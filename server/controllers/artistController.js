const db = require('../db');

//
// 全アーティスト取得
//
async function getAllArtists(req, res) {
  let conn;
  try {
    conn = await db.getConnection();

    // SOLOクリエイターがartistsに未登録でも表示できるよう同期
    await conn.execute(
      `INSERT INTO tbl_artists (artist_id, artist_name)
       SELECT c.creator_id, c.creator_name
       FROM tbl_creators c
       WHERE c.creator_type = 'SOLO'
         AND NOT EXISTS (
           SELECT 1
           FROM tbl_artists a
           WHERE a.artist_id = c.creator_id
         )`,
      []
    );

    await conn.execute(
      `UPDATE tbl_artists a
       SET artist_name = c.creator_name
       FROM tbl_creators c
       WHERE a.artist_id = c.creator_id
         AND c.creator_type = 'SOLO'
         AND a.artist_name <> c.creator_name`,
      []
    );

    const result = await conn.execute(
      `SELECT 
         ar.artist_id,
         ar.artist_id AS creator_id,
         c.creator_name AS artist_name,
         TO_CHAR(ar.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
         TO_CHAR(ar.started_at, 'YYYY-MM-DD') AS started_at,
         TO_CHAR(ar.ended_at, 'YYYY-MM-DD') AS ended_at
       FROM tbl_artists ar
       JOIN tbl_creators c ON ar.artist_id = c.creator_id
       ORDER BY c.creator_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error('アーティスト取得エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// アーティスト作成
//
async function createArtist(req, res) {
  let conn;
  const { creator_id, date_of_birth, started_at, ended_at } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'クリエイターIDは必須です' });
  }

  try {
    conn = await db.getConnection();

    // creator確認
    const creatorCheck = await conn.execute(
      `SELECT creator_name, creator_type
       FROM tbl_creators
       WHERE creator_id = $1`,
      [creator_id]
    );

    if (creatorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'クリエイターが見つかりません' });
    }

    if (creatorCheck.rows[0].creator_type !== 'SOLO') {
      return res.status(400).json({ error: 'SOLOタイプのクリエイターのみアーティスト登録できます' });
    }

    // 既存artist確認
    const artistCheck = await conn.execute(
      `SELECT artist_id
       FROM tbl_artists
       WHERE artist_id = $1`,
      [creator_id]
    );

    if (artistCheck.rows.length > 0) {
      return res.status(400).json({ error: 'このクリエイターのアーティストは既に存在します' });
    }

    await conn.execute(
      `INSERT INTO tbl_artists
       (artist_id, artist_name, date_of_birth, started_at, ended_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        creator_id,
        creatorCheck.rows[0].creator_name,
        date_of_birth || null,
        started_at || null,
        ended_at || null
      ]
    );

    res.status(201).json({
      message: 'アーティストを作成しました',
      artist_id: creator_id,
      creator_id: creator_id
    });

  } catch (err) {
    console.error('アーティスト作成エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// アーティスト更新
//
async function updateArtist(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  const { creator_id, date_of_birth, started_at, ended_at } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'クリエイターIDは必須です' });
  }

  try {
    conn = await db.getConnection();

    const creatorCheck = await conn.execute(
      `SELECT creator_type
       FROM tbl_creators
       WHERE creator_id = $1`,
      [creator_id]
    );

    if (creatorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'クリエイターが見つかりません' });
    }

    if (creatorCheck.rows[0].creator_type !== 'SOLO') {
      return res.status(400).json({ error: 'SOLOタイプのクリエイターのみアーティスト登録できます' });
    }

    const result = await conn.execute(
      `UPDATE tbl_artists
       SET artist_id = $1,
           date_of_birth = $2,
           started_at = $3,
           ended_at = $4
       WHERE artist_id = $5`,
      [creator_id, date_of_birth || null, started_at || null, ended_at || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'アーティストが見つかりません' });
    }

    res.json({
      message: 'アーティストを更新しました',
      artist_id: id,
      creator_id: creator_id
    });

  } catch (err) {
    console.error('アーティスト更新エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// アーティスト削除
//
async function deleteArtist(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  try {
    conn = await db.getConnection();
    await conn.execute('BEGIN');

    const result = await conn.execute(
      `DELETE FROM tbl_creators
       WHERE creator_id = $1
         AND creator_type = 'SOLO'`,
      [id]
    );

    if (result.rowCount === 0) {
      await conn.execute('ROLLBACK');
      return res.status(404).json({ error: 'アーティストが見つかりません' });
    }

    await conn.execute('COMMIT');
    res.json({ message: 'アーティストを削除しました' });

  } catch (err) {
    if (conn) await conn.execute('ROLLBACK');
    if (err && err.code === '23503') {
      return res.status(409).json({
        error: '関連する楽曲・アルバム等が存在するため削除できません'
      });
    }
    console.error('アーティスト削除エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getAllArtists,
  createArtist,
  updateArtist,
  deleteArtist
};
