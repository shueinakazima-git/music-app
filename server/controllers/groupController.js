const db = require('../db');

//
// 全グループ取得
//
async function getAllGroups(req, res) {
  let conn;

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT 
         g.group_id,
         g.group_id AS creator_id,
         c.creator_name AS group_name,
         TO_CHAR(g.formation_date, 'YYYY-MM-DD') AS formation_date,
         TO_CHAR(g.dissolution_date, 'YYYY-MM-DD') AS dissolution_date
       FROM tbl_groups g
       JOIN tbl_creators c ON g.group_id = c.creator_id
       ORDER BY c.creator_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Error getting groups:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループ作成
//
async function createGroup(req, res) {
  let conn;

  const { creator_id, formation_date, dissolution_date } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
  }

  try {
    conn = await db.getConnection();

    const creatorCheck = await conn.execute(
      `SELECT creator_name, creator_type
       FROM tbl_creators
       WHERE creator_id = $1`,
      [creator_id]
    );

    if (creatorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].creator_type !== 'GROUP') {
      return res.status(400).json({ error: 'Only GROUP creators can be groups' });
    }

    const groupCheck = await conn.execute(
      `SELECT group_id
       FROM tbl_groups
       WHERE group_id = $1`,
      [creator_id]
    );

    if (groupCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Group already exists for this creator' });
    }

    await conn.execute(
      `INSERT INTO tbl_groups
       (group_id, group_name, formation_date, dissolution_date)
       VALUES ($1, $2, $3, $4)`,
      [
        creator_id,
        creatorCheck.rows[0].creator_name,
        formation_date || null,
        dissolution_date || null
      ]
    );

    res.status(201).json({
      message: 'Group created successfully',
      group_id: creator_id,
      creator_id: creator_id
    });

  } catch (err) {
    console.error('Error creating group:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループ更新
//
async function updateGroup(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const { formation_date, dissolution_date } = req.body;

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `UPDATE tbl_groups
       SET 
           formation_date = $1,
           dissolution_date = $2
       WHERE group_id = $3`,
      [
        formation_date || null,
        dissolution_date || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group updated successfully',
      group_id: id
    });

  } catch (err) {
    console.error('Error updating group:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループ削除
//
async function deleteGroup(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `DELETE FROM tbl_groups WHERE group_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });

  } catch (err) {
    console.error('Error deleting group:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup
};