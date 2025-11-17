const mysql = require('mysql2/promise');
const bcrypt = require("bcryptjs"); // to hash passwords

// credentials that we'll use for now
// add more if needed
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASS = 'soen287gogo';
const DB_NAME = 'campus_booking';

// Create database if missing
const poolPromise = (async () => {
    const adminConn = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS
    });
    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await adminConn.end();

    const pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // does schema exist?
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student'
    )`);

    return pool;
})();

async function findUser(email, password) {
    const pool = await poolPromise;

    const [rows] = await pool.query(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [email]
    );
    const user = rows[0];
    if (!user) return null;

    // comparing entered password with the hashed one in the DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;

    return user;
}

async function addUser(name, email, password, role = 'student') {
    const pool = await poolPromise;
    const [result] = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, password, role]
    );
    return result.insertId;
}

module.exports = { findUser, addUser };
