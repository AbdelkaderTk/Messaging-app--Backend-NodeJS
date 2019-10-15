const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const Post = require('../model/Post');

const config = require('../config');

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
  },
  login: async function({ email, password }) {
    const user = await User.findOne({email: email});
    if (!user) {
      const error = new Error('User does not exists');
      error.statusCode = 401;
      throw error
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Incorrect password');
      error.statusCode = 401;
      throw error
    }
    const token = jwt.sign({
      userId: user._id,
      email: user.email
    }, config.JWT_SECRET_KEY, {expiresIn: '1h'})
    return {token: token, userId: user._id.toString()}
  },
  createPost: async function({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error({message: 'Invalid user'});
      error.statusCode = 401;
      throw error
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title)
      || !validator.isLength(postInput.title, {min: 5})) {
        errors.push({message: "Title is invalid"});
      }
    if (
      validator.isEmpty(postInput.content)
      || !validator.isLength(postInput.content, {min: 5})) {
        errors.push({message: "Content is invalid"});
      }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.statusCode = 422;
      throw error
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.statusCode = 401;
      throw error
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    })
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    }
  },
}
