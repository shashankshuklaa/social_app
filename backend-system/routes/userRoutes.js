const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getUserProfile,
  updateProfile,
  followUser,
  getAllUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("bio")
    .optional()
    .isLength({ max: 200 }).withMessage("Bio cannot exceed 200 characters"),
];

router.get("/", protect, getAllUsers);
router.get("/:id", protect, getUserProfile);
router.put("/profile", protect, updateProfileValidation, validate, updateProfile);
router.post("/:id/follow", protect, followUser);

module.exports = router;
