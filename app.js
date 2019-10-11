const express = require('express');
const path = require('path');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const graphqlHttp = require('express-graphql');

const config = require('./config');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');

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

app.use('/graphql', graphqlHttp({
  schema: graphqlSchema,
  rootValue: graphqlResolvers,
  graphiql: true,
  formatError(err) {
    if (!err.originalError) {
      return err
    }
    const statusCode = err.originalError.statusCode || 500;
    const message = err.message || 'An error occured';
    const data = err.originalError.data;
    return {statusCode: statusCode, message: message, data: data}
  }
}))

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
    app.listen(8080);
  })
  .catch(err => console.log(err))
