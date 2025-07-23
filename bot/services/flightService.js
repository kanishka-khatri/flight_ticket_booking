const { pool } = require('../../database/mysql-config');

class FlightService {
    async searchFlights(origin, destination, date) {
        try {
            const [flights] = await pool.query(
                `SELECT * FROM flights 
                 WHERE origin = ? 
                 AND destination = ?
                 AND DATE(departure) = ?
                 AND seats > 0
                 ORDER BY departure ASC`,
                [origin.toUpperCase(), destination.toUpperCase(), date]
            );
            return flights;
        } catch (error) {
            console.error('Search flights error:', error);
            throw error;
        }
    }

    async bookFlight(flightId, userId, userName, passengers) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Get flight details
            const [flights] = await conn.query(
                'SELECT * FROM flights WHERE id = ? FOR UPDATE',
                [flightId]
            );
            
            if (!flights.length) throw new Error('Flight not found');
            const flight = flights[0];
            
            // Check seat availability
            if (flight.seats < passengers) {
                throw new Error(`Only ${flight.seats} seats available`);
            }

            // Create/update user
            await conn.query(
                `INSERT INTO users (id, name) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                [userId, userName]
            );

            // Calculate total price
            const totalPrice = flight.price * passengers;

            // Create booking
            const [result] = await conn.query(
                `INSERT INTO bookings 
                 (flight_id, user_id, passengers, total_price)
                 VALUES (?, ?, ?, ?)`,
                [flightId, userId, passengers, totalPrice]
            );

            // Update available seats
            await conn.query(
                'UPDATE flights SET seats = seats - ? WHERE id = ?',
                [passengers, flightId]
            );

            await conn.commit();
            return { bookingId: result.insertId, flight, totalPrice };
        } catch (error) {
            await conn.rollback();
            console.error('Booking error:', error);
            throw error;
        } finally {
            conn.release();
        }
    }

    async getUserBookings(userId) {
    try {
        const [bookings] = await pool.query(
            `SELECT b.id, b.booking_date, b.passengers, b.total_price, b.status,
                    f.origin, f.destination, f.departure, f.airline
             FROM bookings b
             JOIN flights f ON b.flight_id = f.id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC
             LIMIT 10`, // Limit to 10 most recent bookings
            [userId]
        );
        
        // Format dates properly
        return bookings.map(booking => ({
            ...booking,
            departure: new Date(booking.departure),
            booking_date: new Date(booking.booking_date)
        }));
    } catch (error) {
        console.error('Get bookings error:', error);
        throw error;
    }
}
}

// Export an instance of the class
module.exports = new FlightService();