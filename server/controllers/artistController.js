const db = require('../db');

// Get all artists
async function getAllArtists(req, res) {
  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `SELECT ar.ARTIST_ID, ar.ARTIST_ID as CREATOR_ID, c.CREATOR_NAME as ARTIST_NAME, 
              ar.DATE_OF_BIRTH, ar.STARTED_AT, ar.ENDED_AT
       FROM tbl_artists ar
       JOIN tbl_creators c ON ar.artist_id = c.creator_id
       ORDER BY c.CREATOR_NAME`,
      [],
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    res.json(result.rows || []);
  } catch (err) {
    console.error('Error getting artists:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Create a new artist
async function createArtist(req, res) {
  const { creator_id, date_of_birth, started_at, ended_at } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
  }

  try {
    const connection = await db.getConnection();

    // Check if creator exists and is SOLO type
    const creatorCheck = await connection.execute(
      `SELECT creator_type FROM tbl_creators WHERE creator_id = :creator_id`,
      { creator_id: creator_id },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (creatorCheck.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].CREATOR_TYPE !== 'SOLO') {
      await connection.close();
      return res.status(400).json({ error: 'Only SOLO creators can be artists' });
    }

    // Check if artist already exists for this creator
    const artistCheck = await connection.execute(
      `SELECT artist_id FROM tbl_artists WHERE artist_id = :artist_id`,
      { artist_id: creator_id }
    );

    if (artistCheck.rows.length > 0) {
      await connection.close();
      return res.status(400).json({ error: 'Artist already exists for this creator' });
    }

    const result = await connection.execute(
      `INSERT INTO tbl_artists (artist_id, artist_name, date_of_birth, started_at, ended_at)
       VALUES (:artist_id, 
               :artist_name,
               TO_DATE(:date_of_birth, 'YYYY-MM-DD'), 
               TO_DATE(:started_at, 'YYYY-MM-DD'), 
               TO_DATE(:ended_at, 'YYYY-MM-DD'))`,
      {
        artist_id: creator_id,
        artist_name: creatorCheck.rows[0].CREATOR_NAME || 'Unknown',
        date_of_birth: date_of_birth || null,
        started_at: started_at || null,
        ended_at: ended_at || null
      }
    );

    await connection.commit();

    await connection.close();

    res.status(201).json({
      message: 'Artist created successfully',
      artist_id: creator_id,
      creator_id: creator_id
    });
  } catch (err) {
    console.error('Error creating artist:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Update an artist
async function updateArtist(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const { creator_id, date_of_birth, started_at, ended_at } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
  }

  try {
    const connection = await db.getConnection();

    // Check if creator exists and is SOLO type
    const creatorCheck = await connection.execute(
      `SELECT creator_type FROM tbl_creators WHERE creator_id = :creator_id`,
      { creator_id: creator_id },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (creatorCheck.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].CREATOR_TYPE !== 'SOLO') {
      await connection.close();
      return res.status(400).json({ error: 'Only SOLO creators can be artists' });
    }

    const result = await connection.execute(
      `UPDATE tbl_artists
       SET artist_id = :new_artist_id, 
           date_of_birth = TO_DATE(:date_of_birth, 'YYYY-MM-DD'), 
           started_at = TO_DATE(:started_at, 'YYYY-MM-DD'), 
           ended_at = TO_DATE(:ended_at, 'YYYY-MM-DD')
       WHERE artist_id = :artist_id`,
      {
        new_artist_id: creator_id,
        date_of_birth: date_of_birth || null,
        started_at: started_at || null,
        ended_at: ended_at || null,
        artist_id: id
      }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Artist not found' });
    }

    await connection.close();

    res.json({
      message: 'Artist updated successfully',
      artist_id: id,
      creator_id: creator_id
    });
  } catch (err) {
    console.error('Error updating artist:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Delete an artist
async function deleteArtist(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `DELETE FROM tbl_artists WHERE artist_id = :artist_id`,
      { artist_id: id }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Artist not found' });
    }

    await connection.close();

    res.json({ message: 'Artist deleted successfully' });
  } catch (err) {
    console.error('Error deleting artist:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllArtists,
  createArtist,
  updateArtist,
  deleteArtist
};
