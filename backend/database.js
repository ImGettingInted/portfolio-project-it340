const mysql = require('mysql2/promise');
const path = require('path');
const logger = require('./logger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 5000
});

db.pool.on('error', (err) => {
    logger.error({ err, component: 'mysql' }, 'MySQL pool error');
});

module.exports = db;
