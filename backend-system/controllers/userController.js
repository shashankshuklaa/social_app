const User = require("../models/User");
const Post = require("../models/Post");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers following", "name avatar");

    if (!user) {
      return errorResponse(res, 404, "User not found.");
    }

    const postCount = await Post.countDocuments({ userId: user._id });

    return successResponse(res, 200, "User profile fetched.", {
      user,
      postCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return successResponse(res, 200, "Profile updated successfully.", { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return errorResponse(res, 400, "You cannot follow yourself.");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return errorResponse(res, 404, "User not found.");
    }

    const alreadyFollowing = targetUser.followers.includes(currentUserId);

    if (alreadyFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      });
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      });
      return successResponse(res, 200, `Unfollowed ${targetUser.name}.`);
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
      });
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
      });
      return successResponse(res, 200, `Now following ${targetUser.name}.`);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (search/browse)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { _id: { $ne: req.user._id } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select("name email avatar bio followers following")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return successResponse(res, 200, "Users fetched.", {
      users,
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

module.exports = { getUserProfile, updateProfile, followUser, getAllUsers };
