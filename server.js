const express = require('express');
const path = require('path');

const app = express();

console.log(__dirname, './src/index.html')
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/index.html'));
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});