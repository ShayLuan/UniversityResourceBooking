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
// ------------------------------------------------------
// HASHED PASSWORD CASE (normal bcrypt)
    if (user.password.startsWith("$2")) {
        const match = await bcrypt.compare(password, user.password);
        return match ? user : null;
    }

    //  PLAINTEXT PASSWORD SUPPORT
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
// FIND USER BY EMAIL (FOR FORGOT PASSWORD FLOW)
// ------------------------------------------------------
async function findUserByEmail(email) {
    const [rows] = await pool.query(
        "SELECT id, email FROM users WHERE email = ?",
        [email]
    );
    return rows.length > 0 ? rows[0] : null;
}

// ------------------------------------------------------
// RESET USER PASSWORD (NO CURRENT PASSWORD REQUIRED)
// ------------------------------------------------------
async function resetUserPassword(userId, hashedPassword) {
    const [result] = await pool.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId]
    );
    return result.affectedRows > 0;
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

// gets user by ID for the name
async function getUserById(userId) {
    // try to get all fields, might be empty
    // can't let it crash
    try {
        const [rows] = await pool.query(
            "SELECT id, name, email, role, phone, address FROM users WHERE id = ?",
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        // if no phone or address, just the rest
        const [rows] = await pool.query(
            "SELECT id, name, email, role FROM users WHERE id = ?",
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}

// ------------------------------------------------------
// UPDATE USER INFO
// ------------------------------------------------------
async function updateUserInfo(userId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
    }
    if (updates.email !== undefined) {
        fields.push("email = ?");
        values.push(updates.email);
    }
    if (updates.phone !== undefined) {
        fields.push("phone = ?");
        values.push(updates.phone);
    }
    if (updates.address !== undefined) {
        fields.push("address = ?");
        values.push(updates.address);
    }
    
    if (fields.length === 0) {
        return { success: false, error: 'No fields to update' };
    }
    
    values.push(userId);
    
    try {
        const [result] = await pool.query(
            `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
            values
        );
        return { success: result.affectedRows > 0 };
    } catch (err) {
        // add columns if missing
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            try {
                if (updates.phone !== undefined) {
                    await pool.query("ALTER TABLE users ADD COLUMN phone VARCHAR(255) DEFAULT NULL");
                }
                if (updates.address !== undefined) {
                    await pool.query("ALTER TABLE users ADD COLUMN address VARCHAR(500) DEFAULT NULL");
                }
                // retry the update here if need be
                const [result] = await pool.query(
                    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
                    values
                );
                return { success: result.affectedRows > 0 };
            } catch (alterErr) {
                console.error("Error adding columns:", alterErr);
                return { success: false, error: 'Failed to update user info' };
            }
        }
        return { success: false, error: err.message };
    }
}

// verify current pw
async function verifyPassword(userId, password) {
    const [rows] = await pool.query(
        "SELECT password FROM users WHERE id = ?",
        [userId]
    );

    if (rows.length === 0) return false;

    const user = rows[0];

    // check if pw match
    if (user.password.startsWith("$2")) {
        return await bcrypt.compare(password, user.password);
    } else {
        return (password === user.password);
    }
}

async function updateUserPassword(userId, currentPassword, newPassword) {
    // get current pw
    const [rows] = await pool.query(
        "SELECT password FROM users WHERE id = ?",
        [userId]
    );

    if (rows.length === 0) return { success: false, error: 'User not found' };

    const user = rows[0];
    let passwordMatch = false;

    // check if current pw match
    if (user.password.startsWith("$2")) {
        passwordMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
        passwordMatch = (currentPassword === user.password);
    }

    if (!passwordMatch) {
        return { success: false, error: 'Current password is incorrect' };
    }

    // is new pw different from old pw?
    if (currentPassword === newPassword) {
        return { success: false, error: 'New password must be different from current password' };
    }

    // new hash pw
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update pw in db
    const [result] = await pool.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId]
    );

    return { success: result.affectedRows > 0 };
}

// ------------------------------------------------------
// GET ALL RESOURCES (REAL DB VERSION)
// ------------------------------------------------------
async function getAllResources() {
    const [rows] = await pool.query("SELECT * FROM resources");
    return rows;
}


// ------------------------------------------------------
// EXPORTS
// ------------------------------------------------------
module.exports = {
    findUser,
    addUser,
    getUserById,
    verifyPassword,
    updateUserPassword,
    updateUserInfo,
    createBooking,
    getUserBookings,
    updateBooking,
    deleteBooking,
    getAllResources,
    getBookingsByResource,
    findUserByEmail,
    resetUserPassword
};
