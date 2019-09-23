const express = require('express');
const path = require('path');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');

const config = require('./config');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb)  => {
    cb(null, 'images')
  },
  filename: (req, file, cb)  => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

// app.use(bodyParser.urlencoded()); si Content-Type vaut x-www-form-urlencoded <form>
app.use(bodyParser.json()); // si Content-Type vaut application/json
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data
  })
});

mongoose
  .connect(config.MONGODB_URI)
  .then(result => {
    const server = app.listen(8080);
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('Client connected');
    })
  })
  .catch(err => console.log(err))
