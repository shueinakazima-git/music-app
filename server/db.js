// server/db.js
const oracledb = require('oracledb');

async function getConnection() {
  return await oracledb.getConnection({
    user: 'system',
    password: 'Password123',
    connectString: 'localhost/FREEPDB1'
  });
}

module.exports = { 
  getConnection,
  oracledb
};
