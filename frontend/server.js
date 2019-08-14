const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();

// logging
app.use(morgan('tiny'));

// routes: serve build
app.use(express.static(path.join(__dirname, 'build')));
app.get(/^\/([a-zA-Z0-9-_]*)\/?$/, function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(3000);
