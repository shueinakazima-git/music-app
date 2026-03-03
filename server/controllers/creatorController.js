const db = require('../db');

exports.getAllCreators = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT creator_id, creator_name, creator_type
       FROM tbl_creators
       ORDER BY creator_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
      return res.status(400).json({ error: 'creator_name is required' });
    }

    conn = await db.getConnection();

    const result = await conn.execute(
      `INSERT INTO tbl_creators (creator_name, creator_type)
       VALUES ($1, $2)
       RETURNING creator_id`,
      [creatorName, creatorType]
    );

    const creatorId = result.rows[0].creator_id;

    res.json({
      message: 'Creator inserted successfully',
      creator_id: creatorId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updateCreator = async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { name, creator_name, type, creator_type } = req.body || {};
    const creatorName = (name || creator_name || '').trim();
    const creatorType = (type || creator_type || '').trim();

    if (!creatorName && !creatorType) {
      return res.status(400).json({ error: 'nothing to update' });
    }

    conn = await db.getConnection();

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

    res.json({ message: 'Creator updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.deleteCreator = async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    conn = await db.getConnection();

    await conn.execute(
      `DELETE FROM tbl_creators
       WHERE creator_id = $1`,
      [id]
    );

    res.json({ message: 'Creator deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};