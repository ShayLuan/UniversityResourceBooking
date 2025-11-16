const express = require('express');
const { findUser, addUser } = require('./db.js');

const app = express();
const port = 3000;

app.use(express.static('public')); // make all files in the public folder accessible
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(express.json()); // parse JSON bodies

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
// Register route
app.post('/Register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'missing_fields' });
        }
        await addUser(name, email, password, 'student');
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('Duplicate entry'))) {
            return res.status(409).json({ error: 'duplicate_email', message: 'This email is already registered.' });
        }
        return res.status(400).json({ error: 'unknown', message: err.message || 'Registration failed' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});