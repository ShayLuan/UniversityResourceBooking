const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',          
    password: '',          
    database: 'campus_booking'
});

module.exports = pool.promise();
async function findUser(email, password) {
    const [rows] = await pool.promise().query(
        "SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
    );
    return rows[0];
}

async function addUser(email, password, role = 'student') {
    await pool.promise().query(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        [email, password, role]
    );
}

module.exports = { findUser, addUser };
