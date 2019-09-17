const express = require('express');
const path = require('path');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const config = require('./config');
const feedRoutes = require('./routes/feed');

const app = express();

// app.use(bodyParser.urlencoded()); si Content-Type vaut x-www-form-urlencoded <form>
app.use(bodyParser.json()); // si Content-Type vaut application/json
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  const message = error.message;
  res.status(status).json({
    message: message,
  })
});

mongoose
  .connect(config.MONGODB_URI)
  .then(result => {
    app.listen(8080);
  })
  .catch(err => console.log(error))
