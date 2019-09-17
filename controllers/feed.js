const { validationResult } = require('express-validator');

const Post = require('../model/post');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'First Post',
        content: 'This is the first post!',
        imageUrl: 'images/duck.jpg',
        creator: {
          name: 'Abk'
        },
        createdAt: new Date()
      }
    ]
  });
};

exports.createPost = (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(422).json({
      message: 'Failed to create post. Invalid input.',
      errors: validationErrors.array()
    })
  };
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
     title: title,
     imageUrl: 'images/duck.jpg',
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
    .catch(err => console.log(err))
};
