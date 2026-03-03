const db = require('../db');

//
// タグ一覧取得
//
async function getAllTags(req, res) {
  let conn;

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT tag_id, tag_name, note
       FROM tbl_tags
       WHERE deleted_at IS NULL
       ORDER BY tag_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Error getting tags:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

//
// タグ作成
//
async function createTag(req, res) {
  let conn;

  const { tag_name, note } = req.body;

  if (!tag_name) {
    return res.status(400).json({ error: 'tag_name is required' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `INSERT INTO tbl_tags (tag_name, note, user_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING tag_id`,
      [tag_name, note || null, 1]
    );

    const tagId = result.rows[0].tag_id;

    res.status(201).json({
      message: 'Tag created successfully',
      tag_id: tagId,
      tag_name,
      note: note || null
    });

  } catch (err) {
    console.error('Error creating tag:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

//
// タグ更新
//
async function updateTag(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const { tag_name, note } = req.body;

  if (!tag_name) {
    return res.status(400).json({ error: 'tag_name is required' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `UPDATE tbl_tags
       SET tag_name = $1,
           note = $2
       WHERE tag_id = $3`,
      [tag_name, note || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({
      message: 'Tag updated successfully',
      tag_id: id,
      tag_name,
      note: note || null
    });

  } catch (err) {
    console.error('Error updating tag:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

//
// タグ削除（ソフトデリート）
//
async function deleteTag(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `UPDATE tbl_tags
       SET deleted_at = NOW()
       WHERE tag_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });

  } catch (err) {
    console.error('Error deleting tag:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getAllTags,
  createTag,
  updateTag,
  deleteTag
};