const express = require('express');

const router = express.Router();

const feedControllers = require('../controllers/feed');

// GET /feed/posts
router.get('/posts', feedControllers.getPosts);

// POST /feed/post
router.post('/post', feedControllers.createPost);

module.exports = router;
