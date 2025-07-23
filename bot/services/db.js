// flight_ticket_booking/bot/services/db.js

const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // change this if you have a different MySQL user
    password: 'khatri@11193', // add your MySQL password here if any
    database: 'flight_ticket_booking'
});

// Connect
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id', db.threadId);
});

module.exports = db;
