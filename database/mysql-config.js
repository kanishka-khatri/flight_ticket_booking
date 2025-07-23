const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flight_ticket_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Add this function
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Successfully connected to MySQL database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error.message);
    return false;
  }
}

// Export both pool and testConnection
module.exports = {
  pool,
  testConnection
};