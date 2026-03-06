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
    console.error('タグ取得エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
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
  const normalizedTagName = (tag_name || '').toString().trim();
  const normalizedNote = note || null;

  if (!normalizedTagName) {
    return res.status(400).json({ error: 'タグ名は必須です' });
  }

  try {
    conn = await db.getConnection();

    const existing = await conn.execute(
      `SELECT tag_id, deleted_at
       FROM tbl_tags
       WHERE tag_name = $1
       LIMIT 1`,
      [normalizedTagName]
    );

    if (existing.rows.length > 0) {
      const found = existing.rows[0];

      if (!found.deleted_at) {
        return res.status(409).json({
          error: '同名のタグが既に存在します',
          tag_id: found.tag_id
        });
      }

      await conn.execute(
        `UPDATE tbl_tags
         SET note = $1,
             user_id = $2,
             deleted_at = NULL
         WHERE tag_id = $3`,
        [normalizedNote, 1, found.tag_id]
      );

      return res.status(200).json({
        message: 'タグを復元しました',
        tag_id: found.tag_id,
        tag_name: normalizedTagName,
        note: normalizedNote
      });
    }

    const result = await conn.execute(
      `INSERT INTO tbl_tags (tag_name, note, user_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING tag_id`,
      [normalizedTagName, normalizedNote, 1]
    );

    const tagId = result.rows[0].tag_id;

    res.status(201).json({
      message: 'タグを作成しました',
      tag_id: tagId,
      tag_name: normalizedTagName,
      note: normalizedNote
    });

  } catch (err) {
    console.error('タグ作成エラー:', err.message);

    if (err && err.code === '23505') {
      return res.status(409).json({ error: '同名のタグが既に存在します' });
    }

    res.status(500).json({ error: 'サーバーエラーが発生しました' });
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
    return res.status(400).json({ error: 'IDが不正です' });
  }

  const { tag_name, note } = req.body;

  if (!tag_name) {
    return res.status(400).json({ error: 'タグ名は必須です' });
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
      return res.status(404).json({ error: 'タグが見つかりません' });
    }

    res.json({
      message: 'タグを更新しました',
      tag_id: id,
      tag_name,
      note: note || null
    });

  } catch (err) {
    console.error('タグ更新エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
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
    return res.status(400).json({ error: 'IDが不正です' });
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
      return res.status(404).json({ error: 'タグが見つかりません' });
    }

    res.json({ message: 'タグを削除しました' });

  } catch (err) {
    console.error('タグ削除エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
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
