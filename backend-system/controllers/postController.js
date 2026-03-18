const Post = require("../models/Post");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { content, image } = req.body;

    const post = await Post.create({
      userId: req.user._id,
      content,
      image: image || null,
    });

    await post.populate("userId", "name avatar");

    return successResponse(res, 201, "Post created successfully.", { post });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (feed) with pagination
// @route   GET /api/posts
// @access  Private
const getAllPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find()
      .populate("userId", "name avatar")
      .populate("comments.userId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments();

    return successResponse(res, 200, "Posts fetched.", {
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "name avatar")
      .populate("comments.userId", "name avatar");

    if (!post) {
      return errorResponse(res, 404, "Post not found.");
    }

    return successResponse(res, 200, "Post fetched.", { post });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by a specific user
// @route   GET /api/posts/user/:userId
// @access  Private
const getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find({ userId: req.params.userId })
      .populate("userId", "name avatar")
      .populate("comments.userId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ userId: req.params.userId });

    return successResponse(res, 200, "User posts fetched.", {
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return errorResponse(res, 404, "Post not found.");
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "Not authorized to update this post.");
    }

    const { content, image } = req.body;
    if (content) post.content = content;
    if (image !== undefined) post.image = image;

    await post.save();
    await post.populate("userId", "name avatar");

    return successResponse(res, 200, "Post updated successfully.", { post });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return errorResponse(res, 404, "Post not found.");
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "Not authorized to delete this post.");
    }

    await post.deleteOne();

    return successResponse(res, 200, "Post deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// @desc    Like or unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return errorResponse(res, 404, "Post not found.");
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();
      return successResponse(res, 200, "Post unliked.", {
        likes: post.likes.length,
        liked: false,
      });
    } else {
      post.likes.push(userId);
      await post.save();
      return successResponse(res, 200, "Post liked.", {
        likes: post.likes.length,
        liked: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return errorResponse(res, 404, "Post not found.");
    }

    const comment = {
      userId: req.user._id,
      text: req.body.text,
    };

    post.comments.push(comment);
    await post.save();
    await post.populate("comments.userId", "name avatar");

    const newComment = post.comments[post.comments.length - 1];

    return successResponse(res, 201, "Comment added.", { comment: newComment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment from a post
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return errorResponse(res, 404, "Post not found.");
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return errorResponse(res, 404, "Comment not found.");
    }

    const isOwner = comment.userId.toString() === req.user._id.toString();
    const isPostOwner = post.userId.toString() === req.user._id.toString();

    if (!isOwner && !isPostOwner) {
      return errorResponse(res, 403, "Not authorized to delete this comment.");
    }

    comment.deleteOne();
    await post.save();

    return successResponse(res, 200, "Comment deleted.", {
      commentCount: post.comments.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
};
