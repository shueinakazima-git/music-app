const db = require('../db');
const { fetchAllCreators } = require('../services/creatorService');

exports.getAllCreators = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const creators = await fetchAllCreators(conn);
    res.json(creators);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

exports.createCreator = async (req, res) => {
  let conn;
  try {
    const { name, creator_name, type, creator_type } = req.body || {};
    const creatorName = (name || creator_name || '').trim();
    const creatorType = (type || creator_type || 'SOLO').trim();

    if (!creatorName) {
      return res.status(400).json({ error: 'クリエイター名は必須です' });
    }

    conn = await db.getConnection();

    await conn.execute('BEGIN');

    const result = await conn.execute(
      `INSERT INTO tbl_creators (creator_name, creator_type)
       VALUES ($1, $2)
       RETURNING creator_id`,
      [creatorName, creatorType]
    );

    const creatorId = result.rows[0].creator_id;

    if (creatorType === 'SOLO') {
      await conn.execute(
        `INSERT INTO tbl_artists (artist_id, artist_name)
         VALUES ($1, $2)
         ON CONFLICT (artist_id) DO UPDATE
         SET artist_name = EXCLUDED.artist_name`,
        [creatorId, creatorName]
      );
    } else if (creatorType === 'GROUP') {
      await conn.execute(
        `INSERT INTO tbl_groups (group_id, group_name)
         VALUES ($1, $2)
         ON CONFLICT (group_id) DO UPDATE
         SET group_name = EXCLUDED.group_name`,
        [creatorId, creatorName]
      );
    }

    await conn.execute('COMMIT');

    res.json({
      message: 'クリエイターを登録しました',
      creator_id: creatorId
    });

  } catch (err) {
    if (conn) await conn.execute('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updateCreator = async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    const { name, creator_name, type, creator_type } = req.body || {};
    const creatorName = (name || creator_name || '').trim();
    const creatorType = (type || creator_type || '').trim();

    if (!creatorName && !creatorType) {
      return res.status(400).json({ error: '更新対象がありません' });
    }

    conn = await db.getConnection();
    await conn.execute('BEGIN');

    const before = await conn.execute(
      `SELECT creator_name, creator_type
       FROM tbl_creators
       WHERE creator_id = $1`,
      [id]
    );

    if (before.rows.length === 0) {
      await conn.execute('ROLLBACK');
      return res.status(404).json({ error: 'クリエイターが見つかりません' });
    }

    // 動的更新（null上書きしない安全版）
    const fields = [];
    const values = [];
    let index = 1;

    if (creatorName) {
      fields.push(`creator_name = $${index++}`);
      values.push(creatorName);
    }

    if (creatorType) {
      fields.push(`creator_type = $${index++}`);
      values.push(creatorType);
    }

    values.push(id);

    await conn.execute(
      `UPDATE tbl_creators
       SET ${fields.join(', ')}
       WHERE creator_id = $${index}`,
      values
    );

    const after = await conn.execute(
      `SELECT creator_name, creator_type
       FROM tbl_creators
       WHERE creator_id = $1`,
      [id]
    );

    const updatedCreator = after.rows[0];

    if (updatedCreator.creator_type === 'SOLO') {
      await conn.execute(
        `INSERT INTO tbl_artists (artist_id, artist_name)
         VALUES ($1, $2)
         ON CONFLICT (artist_id) DO UPDATE
         SET artist_name = EXCLUDED.artist_name`,
        [id, updatedCreator.creator_name]
      );
      await conn.execute(
        `DELETE FROM tbl_groups
         WHERE group_id = $1`,
        [id]
      );
    } else if (updatedCreator.creator_type === 'GROUP') {
      await conn.execute(
        `INSERT INTO tbl_groups (group_id, group_name)
         VALUES ($1, $2)
         ON CONFLICT (group_id) DO UPDATE
         SET group_name = EXCLUDED.group_name`,
        [id, updatedCreator.creator_name]
      );
      await conn.execute(
        `DELETE FROM tbl_artists
         WHERE artist_id = $1`,
        [id]
      );
    }

    await conn.execute('COMMIT');

    res.json({ message: 'クリエイターを更新しました' });

  } catch (err) {
    if (conn) await conn.execute('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};

exports.deleteCreator = async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'IDが不正です' });
    }

    conn = await db.getConnection();

    await conn.execute(
      `DELETE FROM tbl_creators
       WHERE creator_id = $1`,
      [id]
    );

    res.json({ message: 'クリエイターを削除しました' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
};
