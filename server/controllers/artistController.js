const db = require('../db');

//
// 全アーティスト取得
//
async function getAllArtists(req, res) {
  let conn;
  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT 
         ar.artist_id,
         ar.artist_id AS creator_id,
         c.creator_name AS artist_name,
         ar.date_of_birth,
         ar.started_at,
         ar.ended_at
       FROM tbl_artists ar
       JOIN tbl_creators c ON ar.artist_id = c.creator_id
       ORDER BY c.creator_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Error getting artists:', err.message);
    res.status(500).json({ error: err.message });
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
    return res.status(400).json({ error: 'creator_id is required' });
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
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].creator_type !== 'SOLO') {
      return res.status(400).json({ error: 'Only SOLO creators can be artists' });
    }

    // 既存artist確認
    const artistCheck = await conn.execute(
      `SELECT artist_id
       FROM tbl_artists
       WHERE artist_id = $1`,
      [creator_id]
    );

    if (artistCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Artist already exists for this creator' });
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
      message: 'Artist created successfully',
      artist_id: creator_id,
      creator_id: creator_id
    });

  } catch (err) {
    console.error('Error creating artist:', err.message);
    res.status(500).json({ error: err.message });
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
    return res.status(400).json({ error: 'invalid id' });
  }

  const { creator_id, date_of_birth, started_at, ended_at } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
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
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].creator_type !== 'SOLO') {
      return res.status(400).json({ error: 'Only SOLO creators can be artists' });
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
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({
      message: 'Artist updated successfully',
      artist_id: id,
      creator_id: creator_id
    });

  } catch (err) {
    console.error('Error updating artist:', err.message);
    res.status(500).json({ error: err.message });
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
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `DELETE FROM tbl_artists WHERE artist_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({ message: 'Artist deleted successfully' });

  } catch (err) {
    console.error('Error deleting artist:', err.message);
    res.status(500).json({ error: err.message });
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