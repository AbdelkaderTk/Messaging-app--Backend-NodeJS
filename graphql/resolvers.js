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
    };
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
  updatePost: async function({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error({message: 'Invalid user'});
      error.statusCode = 401;
      throw error
    };
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error({message: 'Post not found'});
      error.statusCode = 404;
      throw error
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error({message: 'Not authorized'});
      error.statusCode = 403;
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
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    }
  },
  posts: async function({ page }, req) {
    if (!req.isAuth) {
      const error = new Error({message: 'Invalid user'});
      error.statusCode = 401;
      throw error
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({createdAt: -1})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator');
    return {
      posts: posts.map(post => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        }
      }),
      totalPosts: totalPosts
    }
  },
  post: async function({ id }, req) {
    if (!req.isAuth) {
      const error = new Error({message: 'Invalid user'});
      error.statusCode = 401;
      throw error
    }
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error({message: 'Post not found'});
      error.statusCode = 404;
      throw error
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  }
}
