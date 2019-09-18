const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../model/user');

exports.signup = (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new Error('Email, password or name is invalid');
    error.statusCode = 422;
    error.data = validationErrors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        name: name
      });
      return user.save();
    })
    .then(createdUser => {
      res.status(201).json({
        message: 'User created',
        userId: createdUser._id
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      };
      next(err);
    })
}
