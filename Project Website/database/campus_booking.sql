-- Create database if needed
CREATE DATABASE IF NOT EXISTS campus_booking;
USE campus_booking;

-- Drop and recreate users table
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample data
INSERT INTO users (id, name, email, password, role) VALUES
    (1, 'Test Name', 'test@abc.com', 'asdf', 'student'),
    (3, 'User Two', 'test2@abc.com', 'asdf', 'student');
