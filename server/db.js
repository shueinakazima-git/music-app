// server/db.js
const oracledb = require('oracledb');

async function getConnection() {
  const user = process.env.DB_USER || 'system';
  const password = process.env.DB_PASSWORD;
  const connectString = process.env.DB_CONNECT_STRING || 'localhost/FREEPDB1';

  if (!password) {
    throw new Error('DB_PASSWORD environment variable is not set');
  }

  return await oracledb.getConnection({
    user,
    password,
    connectString
  });
}

module.exports = { 
  getConnection,
  oracledb
};
