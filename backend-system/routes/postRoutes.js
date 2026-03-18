const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const createPostValidation = [
  body("content")
    .trim()
    .notEmpty().withMessage("Post content is required")
    .isLength({ max: 2000 }).withMessage("Content cannot exceed 2000 characters"),
];

const commentValidation = [
  body("text")
    .trim()
    .notEmpty().withMessage("Comment text is required")
    .isLength({ max: 500 }).withMessage("Comment cannot exceed 500 characters"),
];

router.post("/", protect, createPostValidation, validate, createPost);
router.get("/", protect, getAllPosts);
router.get("/user/:userId", protect, getUserPosts);
router.get("/:id", protect, getPostById);
router.put("/:id", protect, createPostValidation, validate, updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost);
router.post("/:id/comment", protect, commentValidation, validate, addComment);
router.delete("/:id/comment/:commentId", protect, deleteComment);

module.exports = router;
