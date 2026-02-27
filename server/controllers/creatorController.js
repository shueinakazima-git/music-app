const db = require('../db');
const oracledb = db.oracledb;

exports.getAllCreators = async (req, res) => {
  try {
    const conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT creator_id, creator_name, creator_type
       FROM tbl_creators
       ORDER BY creator_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await conn.close();

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.createCreator = async (req, res) => {
  try {
    const { name, creator_name, type, creator_type } = req.body || {};
    const creatorName = (name || creator_name || '').toString().trim();
    const creatorType = (type || creator_type || 'SOLO').toString().trim();

    if (!creatorName) {
      return res.status(400).json({ error: 'creator_name is required' });
    }

    const conn = await db.getConnection();
    let outId;
    if (db.dbType === 'oracle') {
      const binds = {
        creator_name: creatorName,
        creator_type: creatorType,
        creator_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      };
      const result = await conn.execute(
        `INSERT INTO tbl_creators (creator_name, creator_type)
         VALUES (:creator_name, :creator_type)
         RETURNING creator_id INTO :creator_id`,
        binds,
        { autoCommit: true }
      );
      outId = result.outBinds && result.outBinds.creator_id && result.outBinds.creator_id[0];
    } else {
      const result = await conn.execute(
        `INSERT INTO tbl_creators (creator_name, creator_type)
         VALUES (:creator_name, :creator_type)
         RETURNING creator_id`,
        { creator_name: creatorName, creator_type: creatorType },
        { autoCommit: true }
      );
      outId = result.rows[0] && result.rows[0].creator_id;
    }

    await conn.close();
    res.json({ message: 'Creator inserted successfully', creator_id: outId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCreator = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { name, creator_name, type, creator_type } = req.body || {};
    const creatorName = (name || creator_name || '').toString().trim();
    const creatorType = (type || creator_type || '').toString().trim();

    if (!creatorName && !creatorType) {
      return res.status(400).json({ error: 'nothing to update' });
    }

    const conn = await db.getConnection();
    const binds = { 
      creator_name: creatorName || null,
      creator_type: creatorType || null,
      id
    };

    await conn.execute(
      `UPDATE tbl_creators
       SET creator_name = COALESCE(:creator_name, creator_name),
           creator_type = COALESCE(:creator_type, creator_type)
       WHERE creator_id = :id`,
      binds,
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: 'Creator updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCreator = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const conn = await db.getConnection();
    await conn.execute(
      `DELETE FROM tbl_creators WHERE creator_id = :id`,
      { id },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: 'Creator deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
