const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../model/post');
const User = require('../model/user');

exports.getPosts = async (req, res, next) => {
  const page = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  try {
    totalItems = await Post.find().countDocuments()
    const posts = await Post.find()
      .populate('creator')
      .skip((page - 1) * perPage)
      .limit(perPage)
    res.status(200).json({
      message: 'Posts fetched successfully',
      posts: posts,
      totalItems: totalItems
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new Error('Failed to create post. Invalid input.');
    error.statusCode = 422;
    throw error;
  };
  if (!req.file) {
    const error = new Error('Provide a valid file');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const imageUrl = req.file.path.replace("\\","/");
  const content = req.body.content;
  const post = new Post({
     title: title,
     imageUrl: imageUrl,
     content: content,
     creator: req.userId
  })
  try {
    await post.save();
    user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: {_id: user._id, name: user.name }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Post fetched',
      post: post
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new Error('Failed to update post. Invalid input.');
    error.statusCode = 422;
    throw error;
  };
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\","/");
  }
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if (req.userId !== post.creator.toString()) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    };
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
  const updatedPost = await post.save();
  res.status(200).json({
    message: "Post updated",
    post: updatedPost
  });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if (req.userId !== post.creator.toString()) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    };
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    res.status(200).json({
      message: 'Post deleted'
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

const clearImage = relativeFilepath => {
  const absoluteFilepath = path.join(__dirname, '..', relativeFilepath);
  fs.unlink(absoluteFilepath, err => console.log(err));
}
