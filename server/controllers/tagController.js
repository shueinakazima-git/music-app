const db = require('../db');

// Get all tags
async function getAllTags(req, res) {
  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `SELECT TAG_ID, TAG_NAME, NOTE FROM tbl_tags WHERE deleted_at IS NULL ORDER BY TAG_NAME`,
      [],
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    res.json(result.rows || []);
  } catch (err) {
    console.error('Error getting tags:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Create a new tag
async function createTag(req, res) {
  const { tag_name, note } = req.body;

  if (!tag_name) {
    return res.status(400).json({ error: 'tag_name is required' });
  }

  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `INSERT INTO tbl_tags (tag_name, note, user_id, created_at)
       VALUES (:tag_name, :note, 1, SYSDATE)
       RETURNING tag_id INTO :tag_id`,
      {
        tag_name: tag_name,
        note: note || null,
        tag_id: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER }
      }
    );

    await connection.commit();

    const tagId = result.outBinds.tag_id[0];

    await connection.close();

    res.status(201).json({
      message: 'Tag created successfully',
      tag_id: tagId,
      tag_name: tag_name,
      note: note || null
    });
  } catch (err) {
    console.error('Error creating tag:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Update a tag
async function updateTag(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const { tag_name, note } = req.body;

  if (!tag_name) {
    return res.status(400).json({ error: 'tag_name is required' });
  }

  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `UPDATE tbl_tags
       SET tag_name = :tag_name, note = :note
       WHERE tag_id = :tag_id`,
      {
        tag_name: tag_name,
        note: note || null,
        tag_id: id
      }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Tag not found' });
    }

    await connection.close();

    res.json({
      message: 'Tag updated successfully',
      tag_id: id,
      tag_name: tag_name,
      note: note || null
    });
  } catch (err) {
    console.error('Error updating tag:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Delete a tag (soft delete)
async function deleteTag(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `UPDATE tbl_tags
       SET deleted_at = SYSDATE
       WHERE tag_id = :tag_id`,
      { tag_id: id }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Tag not found' });
    }

    await connection.close();

    res.json({ message: 'Tag deleted successfully' });
  } catch (err) {
    console.error('Error deleting tag:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllTags,
  createTag,
  updateTag,
  deleteTag
};
