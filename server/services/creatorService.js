async function fetchAllCreators(conn) {
  const result = await conn.execute(
    `SELECT creator_id, creator_name, creator_type
     FROM tbl_creators
     ORDER BY creator_name`,
    []
  );

  return result.rows;
}

module.exports = {
  fetchAllCreators
};
