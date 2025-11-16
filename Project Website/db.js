const express = require('express');
const path = require('path');
const app = express();
const port = 8080;


const publicPath = path.join(__dirname, 'public');

app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'Home.html'));
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
