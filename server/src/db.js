require('dotenv').config();
const mysql = require('mysql2/promise');

let dbConfig;

if (process.env.MYSQL_URL) {
  const url = new URL(process.env.MYSQL_URL);
  dbConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
  };
} else {
  dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'server_monitor',
  };
}

dbConfig.waitForConnections = true;
dbConfig.connectionLimit = 10;
dbConfig.queueLimit = 0;

const pool = mysql.createPool(dbConfig);

module.exports = pool;
