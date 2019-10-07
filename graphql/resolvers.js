const User = require('../model/user');
const bcrypt = require('bcryptjs');

module.exports = {
  createUser: async function({ userInput }, req) {
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
