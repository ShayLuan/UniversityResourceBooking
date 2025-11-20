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
    getBookingsByResource,
    findUserByEmail,
    resetUserPassword
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


// --------------------------------------------------
// FORGOT PASSWORD — STEP 1: SUBMIT EMAIL
// --------------------------------------------------
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send(`
            <h1>Error</h1>
            <p>Email is required. <a href="/ForgotPassword.html">Try again</a></p>
        `);
    }

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Ready</title>

  <!-- Use your existing styles -->
  <link rel="stylesheet" href="/ForgotPassword.css" />
</head>

<body class="forgotpw">

  <header class="nav_bar">
    <nav>
      <a href="/Home.html">Home</a>
      <a href="/Resources.html">Resources</a>
    </nav>
  </header>

  <main>
    <section id="resetpw-frame">
      <h1>No account found</h1>
      <p>There is no account linked to this email.</p>

      <p><a href="/ForgotPassword.html" class="button">Try Again</a></p>
    </section>
  </main>

  <footer>
    &copy; 2025 Campus Resource Booking System | Contact:
    <br />
    <a id="footer-link" href="mailto:support@campusbooker.edu">
      support@campusbooker.edu
    </a>
  </footer>

</body>
</html>
`);
        }

        req.session.resetUserId = user.id;

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Ready</title>

  <!-- Use your existing styles -->
  <link rel="stylesheet" href="/ForgotPassword.css" />
</head>

<body class="forgotpw">

  <header class="nav_bar">
    <nav>
      <a href="/Home.html">Home</a>
      <a href="/Resources.html">Resources</a>
    </nav>
  </header>

  <main>
    <section id="resetpw-frame">
      <h1>Password Reset Ready</h1>
      <p>Your account has been located. You can now choose a new password.</p>

      <p><a href="/ResetPassword.html" class="button">Continue</a></p>
    </section>
  </main>

  <footer>
    &copy; 2025 Campus Resource Booking System | Contact:
    <br />
    <a id="footer-link" href="mailto:support@campusbooker.edu">
      support@campusbooker.edu
    </a>
  </footer>

</body>
</html>
`);


    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Server error</h1>
            <p>Something went wrong. Please try again later.</p>
        `);
    }
});


// --------------------------------------------------
// FORGOT PASSWORD — STEP 2: SET NEW PASSWORD
// --------------------------------------------------
app.post('/reset-password', async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.session.resetUserId;

    if (!userId) {
        return res.status(400).send(`
            <h1>Reset expired</h1>
            <p>
                Your reset session has expired.
                <br><br>
                <a href="/ForgotPassword.html">Start over</a>
            </p>
        `);
    }

    if (!newPassword || !confirmPassword) {
        return res.status(400).send(`
            <h1>Error</h1>
            <p>All fields are required. <a href="/ResetPassword.html">Try again</a></p>
        `);
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).send(`
            <h1>Error</h1>
            <p>Passwords do not match. <a href="/ResetPassword.html">Try again</a></p>
        `);
    }

    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        const ok = await resetUserPassword(userId, hashed);

        delete req.session.resetUserId;

        if (!ok) {
            return res.status(500).send(`
                <h1>Error</h1>
                <p>Could not update password. Please try again.</p>
            `);
        }

        res.send(`
            <h1>Password updated</h1>
            <p>Your password was changed successfully.</p>
            <p><a href="/Login.html">Go to Login</a></p>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Server error</h1>
            <p>Something went wrong. Please try again later.</p>
        `);
    }
});


/* ---------------------------------------------------
   GET BOOKINGS BY RESOURCE
----------------------------------------------------*/
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

// USER PROFILE
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

// START SERVER
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
