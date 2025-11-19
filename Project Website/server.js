const express = require('express');
const session = require('express-session');
const bcrypt = require("bcryptjs");

const {
    findUser,
    addUser,
    createBooking,
    getUserBookings,
    updateBooking,
    deleteBooking,
    getAllResources,
    getBookingsByResource
} = require('./db.js');

const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
    secret: 'campus-booking-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Home
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/Home.html');
});

// LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUser(email, password);

        if (!user) {
            return res.status(401).send(`
                <h1>Invalid login</h1>
                <p><a href="/Login.html">Try again</a></p>
            `);
        }

        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;

        if (user.role === 'admin') {
            return res.redirect('/AdminDashboard.html');
        }
        return res.redirect('/StudentDashboard.html');

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

/* ---------------------------------------------------
   🔹 GET BOOKINGS BY RESOURCE (for Spotlight Calendar)
----------------------------------------------------*/
app.get('/api/bookings/resource/:resourceName', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const resourceName = req.params.resourceName;
        const rows = await getBookingsByResource(resourceName);

        // Normalize dates → "YYYY-MM-DD"
        const normalized = rows.map(row => {
            let d = new Date(row.date);

            if (!isNaN(d)) {
                row.date = d.toISOString().split("T")[0];
            }

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

        const id = await createBooking(
            req.session.userId,
            resource,
            date,
            time,
            duration
        );

        res.json({ ok: true, bookingId: id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create booking' });
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

        const ok = await updateBooking(
            bookingId,
            req.session.userId,
            resource,
            date,
            time,
            duration
        );

        if (!ok) return res.status(404).json({ error: 'Booking not found' });

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

// GET RESOURCES
app.get('/api/resources', async (_req, res) => {
    try {
        res.json(await getAllResources());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load resources" });
    }
});

// START SERVER
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
