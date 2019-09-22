const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const config = require('../config');

exports.signup = async (req, res, next) => {
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
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      name: name
    });
    const createdUser = await user.save();
    res.status(201).json({
      message: 'User created',
      userId: createdUser._id
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err);
  }
}

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const existingUser = await User.findOne({email: email});
    if (!existingUser) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    };
    const isEqual = await bcrypt.compare(password, existingUser.password);
    if (!isEqual) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    };
    const token = jwt.sign({
      email: email,
      userId: existingUser._id.toString()
      },
      config.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      message: 'Connected',
      userId: existingUser._id.toString(),
      token: token
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err)
  }
}

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error
    }
    res.status(200).json({
      message: 'Fetch status successfully',
      status: user.status
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err)
  }
}

exports.updateUserStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new Error('Failed to update post. Invalid input.');
    error.statusCode = 422;
    throw error;
  };
  try {
    let user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error
    }
    user.status = newStatus;
    user = await user.save();
    res.status(200).json({
      message: 'Status updated successfully',
      status: user.status
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err)
  }
}
