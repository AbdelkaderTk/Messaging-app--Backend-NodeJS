const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');

const User = require('../model/user');

const router = express.Router();

router.put('/signup', [
  body('email')
    .isEmail()
    .withMessage('Please, enter a valid email.')
    .custom((value, {req}) => {
      return User.findOne({email: value}).then(user => {
        if (user) {
          return Promise.reject('This email is already used.')
        }
      })
    })
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({min: 5}),
  body('name')
    .trim()
    .not()
    .isEmpty()
  ], authController.signup
);

module.exports = router;