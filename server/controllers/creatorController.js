const oracledb = require('oracledb');
const { getConnection } = require('../db');

exports.getAllCreators = async (req, res) => {
  try {
    const conn = await getConnection();

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
    const { creator_name, creator_type } = req.body;
    const conn = await getConnection();

    const result = await conn.execute(
      `INSERT INTO tbl_creators (creator_name, creator_type)
       VALUES (:creator_name, :creator_type)
       RETURNING creator_id INTO :creator_id`,
      { 
        creator_name, 
        creator_type,
        creator_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Creator inserted successfully", creator_id: result.outBinds.creator_id[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCreator = async (req, res) => {
  try {
    const id = req.params.id;
    const { creator_name, creator_type } = req.body;

    const conn = await getConnection();

    await conn.execute(
      `UPDATE tbl_creators
       SET creator_name = :creator_name,
           creator_type = :creator_type
       WHERE creator_id = :id`,
      { creator_name, creator_type, id },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Creator updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCreator = async (req, res) => {
  try {
    const id = req.params.id;
    const conn = await getConnection();

    // 関連データを削除（ON DELETE CASCADEで自動削除されるので、直接削除すればOK）
    await conn.execute(
      `DELETE FROM tbl_creators WHERE creator_id = :id`,
      { id },
      { autoCommit: true }
    );

    await conn.close();
    res.json({ message: "Creator deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
