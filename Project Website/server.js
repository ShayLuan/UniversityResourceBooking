const express = require('express');
const session = require('express-session');
const { findUser, addUser, createBooking, getUserBookings, updateBooking, deleteBooking } = require('./db.js');
const bcrypt = require("bcryptjs"); // to hash passwords

const app = express();
const port = 3000;

app.use(express.static('public')); // make all files in the public folder accessible
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(express.json()); // parse JSON bodies

// Session configuration
app.use(session({
    secret: 'campus-booking-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/Home.html');
});

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

        // Store user in session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;

        if (user.role === 'admin') {
            return res.redirect('/AdminDashboard.html');
        } else {
            return res.redirect('/StudentDashboard.html');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


//Register route (for students)
app.post('/Register', async (req, res) => {
    const { name, email, password, 'confirm-password': confirmPassword } = req.body;

    try {
        // just making sure everything is filled out
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                error: 'missing_fields',
                message: 'Please fill in all the fields '
            });
        }

        // check if both passwords match
        if (password !== confirmPassword) {
            return res.status( 400).json({
                error: 'password_mismatch',
                message: 'Your passwords don’t match. Please double check '
            });
        }

        //hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // add the user to the DB as a student
        await addUser(name, email, hashedPassword, 'student');
        return res.json({ ok: true } );

    }    catch (err) {
        console.log( err);

    
        // email already used
        if (err.code === 'ER_DUP_ENTRY' ) {
            return res.status(409).json({
                error: 'duplicate_email',
                message: 'This email is already registered. '
            });
        }

        // if something unexpected went wrong , we send an error msg
        return res.status(400).json({
            error: 'unknown',
            message: 'Something went wrong. Please try again.'
        });
    }
});

// Create booking endpoint
app.post('/api/bookings', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { resource, date, time, duration } = req.body;

        if (!resource || !date || !time || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const bookingId = await createBooking(req.session.userId, resource, date, time, duration);
        return res.json({ ok: true, bookingId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get user bookings endpoint
app.get('/api/bookings', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const bookings = await getUserBookings(req.session.userId);
        
        // okay maybe formatting the date here helps with display?
        const formattedBookings = bookings.map(booking => {
            const formatted = { ...booking };
            // convert date to YYYY-MM-DD string
            if (booking.date instanceof Date) {
                const year = booking.date.getFullYear();
                const month = String(booking.date.getMonth() + 1).padStart(2, '0');
                const day = String(booking.date.getDate()).padStart(2, '0');
                formatted.date = `${year}-${month}-${day}`;
            } else if (typeof booking.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
                const date = new Date(booking.date);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    formatted.date = `${year}-${month}-${day}`;
                }
            }
            return formatted;
        });
        
        return res.json(formattedBookings);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Update booking endpoint
app.put('/api/bookings/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const bookingId = parseInt(req.params.id);
        const { resource, date, time, duration } = req.body;

        if (!resource || !date || !time || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const updated = await updateBooking(bookingId, req.session.userId, resource, date, time, duration);

        if (updated) {
            return res.json({ ok: true });
        } else {
            return res.status(404).json({ error: 'Booking not found' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update booking' });
    }
});


app.delete('/api/bookings/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const bookingId = parseInt(req.params.id);
        const deleted = await deleteBooking(bookingId, req.session.userId);

        if (deleted) {
            return res.json({ ok: true });
        } else {
            return res.status(404).json({ error: 'Booking not found' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete booking' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});