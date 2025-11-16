const express = require('express');
const { findUser } = require('./db.js');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});