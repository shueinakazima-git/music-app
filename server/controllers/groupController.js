const db = require('../db');

// Get all groups
async function getAllGroups(req, res) {
  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `SELECT g.GROUP_ID, g.GROUP_ID as CREATOR_ID, c.CREATOR_NAME as GROUP_NAME, 
              g.FORMATION_DATE, g.DISSOLUTION_DATE
       FROM tbl_groups g
       JOIN tbl_creators c ON g.group_id = c.creator_id
       ORDER BY c.CREATOR_NAME`,
      [],
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    res.json(result.rows || []);
  } catch (err) {
    console.error('Error getting groups:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Create a new group
async function createGroup(req, res) {
  const { creator_id, formation_date, dissolution_date } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
  }

  try {
    const connection = await db.getConnection();

    // Check if creator exists and is GROUP type
    const creatorCheck = await connection.execute(
      `SELECT creator_type FROM tbl_creators WHERE creator_id = :creator_id`,
      { creator_id: creator_id },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (creatorCheck.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].creator_type !== 'GROUP') {
      await connection.close();
      return res.status(400).json({ error: 'Only GROUP creators can be groups' });
    }

    // Check if group already exists for this creator
    const groupCheck = await connection.execute(
      `SELECT group_id FROM tbl_groups WHERE group_id = :group_id`,
      { group_id: creator_id }
    );

    if (groupCheck.rows.length > 0) {
      await connection.close();
      return res.status(400).json({ error: 'Group already exists for this creator' });
    }

    const result = await connection.execute(
      `INSERT INTO tbl_groups (group_id, group_name, formation_date, dissolution_date)
       VALUES (:group_id, 
               :group_name,
               TO_DATE(:formation_date, 'YYYY-MM-DD'), 
               TO_DATE(:dissolution_date, 'YYYY-MM-DD'))`,
      {
        group_id: creator_id,
        group_name: creatorCheck.rows[0].CREATOR_NAME || 'Unknown',
        formation_date: formation_date || null,
        dissolution_date: dissolution_date || null
      }
    );

    await connection.commit();

    await connection.close();

    res.status(201).json({
      message: 'Group created successfully',
      group_id: creator_id,
      creator_id: creator_id
    });
  } catch (err) {
    console.error('Error creating group:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Update a group
async function updateGroup(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const { creator_id, formation_date, dissolution_date } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
  }

  try {
    const connection = await db.getConnection();

    // Check if creator exists and is GROUP type
    const creatorCheck = await connection.execute(
      `SELECT creator_type FROM tbl_creators WHERE creator_id = :creator_id`,
      { creator_id: creator_id },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (creatorCheck.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'Creator not found' });
    }

    if (creatorCheck.rows[0].creator_type !== 'GROUP') {
      await connection.close();
      return res.status(400).json({ error: 'Only GROUP creators can be groups' });
    }

    const result = await connection.execute(
      `UPDATE tbl_groups
       SET group_id = :new_group_id, 
           formation_date = TO_DATE(:formation_date, 'YYYY-MM-DD'), 
           dissolution_date = TO_DATE(:dissolution_date, 'YYYY-MM-DD')
       WHERE group_id = :group_id`,
      {
        new_group_id: creator_id,
        formation_date: formation_date || null,
        dissolution_date: dissolution_date || null,
        group_id: id
      }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Group not found' });
    }

    await connection.close();

    res.json({
      message: 'Group updated successfully',
      group_id: id,
      creator_id: creator_id
    });
  } catch (err) {
    console.error('Error updating group:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Delete a group
async function deleteGroup(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const connection = await db.getConnection();

    const result = await connection.execute(
      `DELETE FROM tbl_groups WHERE group_id = :group_id`,
      { group_id: id }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Group not found' });
    }

    await connection.close();

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error('Error deleting group:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup
};
