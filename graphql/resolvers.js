const User = require('../model/user');
const bcrypt = require('bcryptjs');
const validator = require('validator');

module.exports = {
  createUser: async function({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({message: 'Email is not valid'});
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, {min: 5})
    ) {
        errors.push({message: 'Password is not valid'});
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.statusCode = 422;
      throw error
    }
    const email = userInput.email;
    const existingUser = await User.findOne({email: email});
    if (existingUser) {
      const error = new Error('This user already exists');
      throw error;
    }
    const hashedPassword = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: email,
      name: userInput.name,
      password: hashedPassword
    })
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  }
}
