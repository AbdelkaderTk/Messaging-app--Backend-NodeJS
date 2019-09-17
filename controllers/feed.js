const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../model/post');

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status(200).json({
        message: 'Posts fetched successfully',
        posts: posts
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

exports.createPost = (req, res, next) => {
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
     creator: {
       name: 'Abk'
     },
  })
  post.save()
    .then(createdPost => {
      console.log(createdPost);
      res.status(201).json({
        message: 'Post created successfully!',
        post: createdPost
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Post fetched',
        post: post
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new Error('Failed to create post. Invalid input.');
    error.statusCode = 422;
    throw error;
  };
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\","/");
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then(updatedPost => {
      res.status(200).json({
        message: "Post updated",
        post: updatedPost
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

const clearImage = relativeFilepath => {
  const absoluteFilepath = path.join(__dirname, '..', relativeFilepath);
  fs.unlink(absoluteFilepath, err => console.log(err));
}
