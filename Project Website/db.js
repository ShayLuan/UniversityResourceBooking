const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

// ------------------------------------------------------
// DATABASE POOL
// ------------------------------------------------------
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "soen287gogo",
    database: "campus_booking"
});

// ------------------------------------------------------
// FIND USER (LOGIN)
// ------------------------------------------------------
async function findUser(email, password) {
    const [rows] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );

    if (rows.length === 0) return null;
    const user = rows[0];

    // HASHED PASSWORD CASE (normal bcrypt)
    if (user.password.startsWith("$2")) {
        const match = await bcrypt.compare(password, user.password);
        return match ? user : null;
    }

    // LEGACY PLAINTEXT PASSWORD SUPPORT
    if (password === user.password) {
        return user;
    }

    return null;
}

// ------------------------------------------------------
// ADD USER (REGISTER)
// ------------------------------------------------------
async function addUser(name, email, hashedPassword, role = "student") {
    const [result] = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
    );

    return result.insertId;
}

// ------------------------------------------------------
// CREATE BOOKING
// ------------------------------------------------------
async function createBooking(userId, resource, date, time, duration) {
    const [result] = await pool.query(
        `INSERT INTO bookings (user_id, resource, date, time, duration)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, resource, date, time, duration]
    );

    return result.insertId;
}

// ------------------------------------------------------
// GET BOOKINGS FOR LOGGED-IN USER
// ------------------------------------------------------
async function getUserBookings(userId) {
    const [rows] = await pool.query(
        "SELECT * FROM bookings WHERE user_id = ? ORDER BY date DESC",
        [userId]
    );
    return rows;
}

// ------------------------------------------------------
// UPDATE BOOKING
// ------------------------------------------------------
async function updateBooking(id, userId, resource, date, time, duration) {
    const [result] = await pool.query(
        `UPDATE bookings
         SET resource = ?, date = ?, time = ?, duration = ?
         WHERE id = ? AND user_id = ?`,
        [resource, date, time, duration, id, userId]
    );

    return result.affectedRows > 0;
}

// ------------------------------------------------------
// GET BOOKINGS FOR A RESOURCE (CALENDAR USES THIS)
// ------------------------------------------------------
async function getBookingsByResource(resourceName) {
    const [rows] = await pool.query(
        `SELECT id, user_id, resource, date, time, duration
         FROM bookings
         WHERE resource = ?`,
        [resourceName]
    );

    return rows;
}

// ------------------------------------------------------
// DELETE BOOKING
// ------------------------------------------------------
async function deleteBooking(id, userId) {
    const [result] = await pool.query(
        "DELETE FROM bookings WHERE id = ? AND user_id = ?",
        [id, userId]
    );

    return result.affectedRows > 0;
}

// ------------------------------------------------------
// GET ALL RESOURCES
// ------------------------------------------------------
async function getAllResources() {
    return [
        { id: 1, name: "study-rooms", category: "Study Spaces" },
        { id: 2, name: "computer-labs", category: "Labs" },
        { id: 3, name: "sports-facilities", category: "Athletics" },
        { id: 4, name: "event-spaces", category: "Events" },
        { id: 5, name: "library-resources", category: "Library" }
    ];
}

// ------------------------------------------------------
// EXPORTS
// ------------------------------------------------------
module.exports = {
    findUser,
    addUser,
    createBooking,
    getUserBookings,
    updateBooking,
    deleteBooking,
    getAllResources,
    getBookingsByResource
};
