const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const config = require('../config');

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

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({email: email})
    .then(existingUser => {
      if (!existingUser) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      };
      loadedUser = existingUser;
      return bcrypt.compare(password, existingUser.password)
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({
        email: email,
        userId: loadedUser._id.toString()
        },
        config.JWT_SECRET_KEY,
        { expiresIn: '1h' })
      res.status(200).json({
        message: 'Connected',
        userId: loadedUser._id.toString(),
        token: token
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      };
      next(err)
    })
}

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error
      }
      res.status(200).json({
        message: 'Fetch status successfully',
        status: user.status
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      };
      next(err)
    })
}

exports.updateUserStatus = (req, res, next) => {
  const newStatus = req.body.status;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new Error('Failed to update post. Invalid input.');
    error.statusCode = 422;
    throw error;
  };
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error
      }
      console.log(user);
      user.status = newStatus;
      return user.save();
    })
    .then(user => {
      res.status(200).json({
        message: 'Status updated successfully',
        status: user.status
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      };
      next(err)
    })
}
