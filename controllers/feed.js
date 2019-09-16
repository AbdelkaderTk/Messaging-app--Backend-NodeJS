exports.getPosts = (req, res, next) => {
  res.status(200).json({
    post: [{title: 'First post', content: 'This is my first post!'}]
  })
}

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  console.log(title, content);
  // Create post in db
  res.status(201).json({
    message: "Post created successfully",
    post: {id: Date.now(), title: title, content: content}
  })
}
