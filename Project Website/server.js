const express = require('express');
const { findUser, addUser } = require('./db.js');
const bcrypt = require("bcryptjs"); // to hash passwords

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});