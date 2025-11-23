const express = require('express');
const session = require('express-session');
const bcrypt = require("bcryptjs");

const {
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
    addResource,
    getResourceByName,
    deleteResource,
    updateResourceSuspended,
    duplicateResource,
    getBookingsByResource,
    getPastBookings,
    getUpcomingBookings,
    getTotalBookings,
    getBookingsPerDay,
    getTopResources,
    getAverageDuration,
    getActiveUsers,
    createAnnouncement,
    getAnnouncements
} = require('./db.js');

const app = express();
const port = 5000;

// Session
app.use(session({
    secret: 'campus-booking-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));


// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Home
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/Home.html');
});

// LOGIN
app.post('/Login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUser(email, password);

        if (!user) {
            return res.redirect('/Login.html?error=1');
        }

        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;

        if (user.role === 'admin') {
            return res.redirect('/LoginAdmin.html');
        } else if (user.role === 'faculty') {
            return res.redirect('/FacultyDashboard.html');
        } else {
            return res.redirect('/StudentDashboard.html');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// LOGIN for admin
app.post('/LoginAdmin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUser(email, password);

        if (!user) {
            return res.redirect('/Login.html?error=1');
        }

        if (user.role !== 'admin') {
            return res.redirect('/Login.html?error=notAdmin');
        }

        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;

        return res.redirect('/AdminDashboard.html');

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// GET BOOKINGS BY RESOURCE (for Spotlight Calendar)
app.get('/api/bookings/resource/:resourceName', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const resourceName = req.params.resourceName;
        const rows = await getBookingsByResource(resourceName);

        const normalized = rows.map(row => {
            let d = new Date(row.date);
            if (!isNaN(d)) row.date = d.toISOString().split("T")[0];
            return row;
        });

        res.json(normalized);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load resource bookings" });
    }
});

// REGISTER
app.post('/Register', async (req, res) => {
    const { name, email, password, 'confirm-password': confirmPassword } = req.body;

    try {
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                error: 'missing_fields',
                message: 'Please fill in all the fields'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'password_mismatch',
                message: 'Your passwords don’t match.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await addUser(name, email, hashedPassword, 'student');

        res.json({ ok: true });

    } catch (err) {
        console.log(err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'duplicate_email',
                message: 'This email is already registered.'
            });
        }

        res.status(400).json({
            error: 'unknown',
            message: 'Something went wrong.'
        });
    }
});

// CREATE BOOKING
app.post('/api/bookings', async (req, res) => {
    try {
        if (!req.session.userId)
            return res.status(401).json({ error: 'Not authenticated' });

        const { resource, date, time, duration } = req.body;

        if (!resource || !date || !time || !duration)
            return res.status(400).json({ error: 'Missing fields' });

        const result = await createBooking(
            req.session.userId,
            resource,
            date,
            time,
            duration
        );

        if (!result.ok) {
            // conflict or validation error
            return res.status(400).json(result);
        }

        res.json({ ok: true, bookingId: result.bookingId });

    } catch (err) {
        console.error("Create booking error:", err);
        res.status(500).json({ ok: false, error: err.message || 'Failed to create booking' });
    }
});

// GET USER BOOKINGS
app.get('/api/bookings', async (req, res) => {
    try {
        if (!req.session.userId)
            return res.status(401).json({ error: 'Not authenticated' });

        const rows = await getUserBookings(req.session.userId);

        const normalized = rows.map(row => {
            let d = new Date(row.date);
            if (!isNaN(d)) row.date = d.toISOString().split("T")[0];
            return row;
        });

        res.json(normalized);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load your bookings" });
    }
});

// UPDATE BOOKING
app.put('/api/bookings/:id', async (req, res) => {
    try {
        if (!req.session.userId)
            return res.status(401).json({ error: 'Not authenticated' });

        const bookingId = Number(req.params.id);
        const { resource, date, time, duration } = req.body;

        const result = await updateBooking(
            bookingId,
            req.session.userId,
            resource,
            date,
            time,
            duration
        );

        if (!result.ok) {
            const status = result.error === 'Booking not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        res.json({ ok: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update booking" });
    }
});

// DELETE BOOKING
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        if (!req.session.userId)
            return res.status(401).json({ error: 'Not authenticated' });

        const ok = await deleteBooking(
            Number(req.params.id),
            req.session.userId
        );

        if (!ok) return res.status(404).json({ error: 'Booking not found' });

        res.json({ ok: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete booking" });
    }
});

// VIEW PAST AND UPCOMING BOOKINGS
app.get("/api/bookings/:id", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = Number(req.params.id);
        const type = req.query.type;

        if (req.session.userRole !== 'admin' && req.session.userId !== userId) {
            return res.status(403).json({ error: 'Booking not found' });
        }

        let bookings;
        if (type === 'past') {
            bookings = await getPastBookings(userId);
        } else if (type === 'upcoming') {
            bookings = await getUpcomingBookings(userId);
        } else {
            return res.status(400).json({ error: "Query parameter 'type' must be 'past' or 'upcoming'" });
        }

        const normalied = bookings.map((row) => {
            const d = new Date(row.date);
            if (!isNaN(d)) row.date = d.toISOString().split("T")[0];
            return row;
        });

        res.json(normalied);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load bookings" })
    }
});

// get current user's data
app.get('/api/user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await getUserById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || null,
            address: user.address || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load user data" });
    }
});

// VERIFY PASSWORD
app.post('/api/user/verify-password', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const isValid = await verifyPassword(req.session.userId, password);
        res.json({ valid: isValid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to verify password" });
    }
});

// UPDATE USER INFO
app.put('/api/user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { name, email, phone, address } = req.body;
        const updates = {};

        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        if (email !== undefined && !email.trim()) {
            return res.status(400).json({ error: 'Email cannot be empty' });
        }

        const result = await updateUserInfo(req.session.userId, updates);

        if (!result.success) {
            return res.status(400).json({ error: result.error || 'Failed to update user info' });
        }

        if (email !== undefined) {
            req.session.userEmail = email;
        }

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update user info" });
    }
});

// UPDATE PASSWORD
app.put('/api/user/password', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password and confirmation do not match' });
        }

        const result = await updateUserPassword(
            req.session.userId,
            currentPassword,
            newPassword
        );

        if (!result.success) {
            return res.status(400).json({ error: result.error || 'Failed to update password' });
        }

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update password" });
    }
});

// GET RESOURCES
app.get('/api/resources', async (_req, res) => {
    try {
        res.json(await getAllResources());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load resources" });
    }
});

// do we need to authenticate this?
// check back later
app.post('/api/resources', async (req, res) => {
    try {
        const { name, category, description, location, capacity } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: "Name and category are required" });
        }

        const resourceId = await addResource(name, category, description, location, capacity, null);
        res.json({ ok: true, id: resourceId, message: "Resource added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add resource" });
    }
});

// delete resource
app.delete('/api/resources/:name', async (req, res) => {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({ error: "Resource name is required" });
        }

        const deleted = await deleteResource(name);
        if (deleted) {
            res.json({ ok: true, message: "Resource deleted successfully" });
        } else {
            res.status(404).json({ error: "Resource not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete resource" });
    }
});

// suspend/resume resource
app.put('/api/resources/:name/suspend', async (req, res) => {
    try {
        const { name } = req.params;
        const { suspended } = req.body;

        if (!name || typeof suspended !== 'boolean') {
            return res.status(400).json({ error: "Resource name and suspended status are required" });
        }

        const updated = await updateResourceSuspended(name, suspended);
        if (updated) {
            res.json({ ok: true, message: `Resource ${suspended ? 'suspended' : 'resumed'} successfully` });
        } else {
            res.status(404).json({ error: "Resource not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update resource status" });
    }
});

// duplicate resource
app.post('/api/resources/:name/duplicate', async (req, res) => {
    try {
        const { name } = req.params;
        const { newName } = req.body;

        if (!name || !newName) {
            return res.status(400).json({ error: "Original resource name and new name are required" });
        }

        // check if new name already exists
        const existing = await getResourceByName(newName);
        if (existing) {
            return res.status(400).json({ error: "A resource with this name already exists" });
        }

        const resourceId = await duplicateResource(name, newName);
        res.json({ ok: true, id: resourceId, message: "Resource duplicated successfully" });
    } catch (err) {
        console.error(err);
        if (err.message === "Resource not found") {
            res.status(404).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Failed to duplicate resource" });
        }
    }
});
app.get('/api/analytics/summary', async (req, res) => {
    try {
        const totalBookings = await getTotalBookings();
        const bookingsPerDay = await getBookingsPerDay();
        const topResources = await getTopResources();
        const avgDuration = await getAverageDuration();
        const activeUsers = await getActiveUsers();

        res.json({
            totalBookings,
            bookingsPerDay,
            topResources,
            avgDuration,
            activeUsers
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load analytics" });
    }
});



// POST ANNOUNCEMENT (Admin only)
app.post('/api/announcements', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        if (req.session.userRole !== 'admin') {
            return res.status(403).json({ error: 'Only administrators can send announcements' });
        }
        
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        if (message.length > 300) {
            return res.status(400).json({ error: 'Message exceeds 300 characters' });
        }
        
        const announcementId = await createAnnouncement(message.trim(), req.session.userId);
        res.json({ ok: true, id: announcementId, message: "Announcement sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send announcement" });
    }
});

// GET ANNOUNCEMENTS (Students and Faculty)
app.get('/api/announcements', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const announcements = await getAnnouncements();
        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load announcements" });
    }
});

// START SERVER
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
