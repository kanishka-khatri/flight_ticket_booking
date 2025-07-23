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

class DatabaseService {
  async createBooking(flightId, userId, userName, passengers, totalPrice) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Create/update user
      await conn.query(
        `INSERT INTO users (id, name) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [userId, userName]
      );

      // Create booking
      const [result] = await conn.query(
        `INSERT INTO bookings 
         (flight_id, user_id, passengers, total_price)
         VALUES (?, ?, ?, ?)`,
        [flightId, userId, passengers, totalPrice]
      );

      // Update flight seats
      await conn.query(
        `UPDATE flights SET seats = seats - ? WHERE id = ?`,
        [passengers, flightId]
      );

      await conn.commit();
      return result.insertId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getUserBookings(userId) {
    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_date, b.passengers, b.total_price, b.status,
              f.origin, f.destination, f.departure, f.airline
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    return bookings;
  }
}

module.exports = new DatabaseService();