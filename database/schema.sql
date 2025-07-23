use flight_ticket_booking;

-- Drop tables if they exist
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS users;

-- Create tables
CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  departure DATETIME NOT NULL,
  arrival DATETIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  seats INT NOT NULL,
  airline VARCHAR(50) NOT NULL
);

CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  passengers INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample flights
INSERT INTO flights (origin, destination, departure, arrival, price, seats, airline) VALUES
('UDR', 'DEL', '2025-07-25 08:00:00', '2025-07-25 10:00:00', 150.00, 100, 'Air India'),
('DEL', 'UDR', '2025-07-26 18:00:00', '2025-07-26 20:00:00', 140.00, 100, 'IndiGo');