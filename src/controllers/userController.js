const { User, PasswordResetRequest, Order } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    const usersData = users.map(user => user.toPublicJSON());

    return paginatedResponse(res, usersData, page, limit, total, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return errorResponse(res, 'Cannot delete admin users', 400);
    }

    await User.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user by email
// @route   DELETE /api/admin/users/by-email
// @access  Admin
const deleteUserByEmail = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    const query = { email };
    if (name) {
      query.name = name;
    }

    const user = await User.findOne(query);

    if (!user) {
      return errorResponse(res, 'User not found with provided email/name', 404);
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    // Prevent deleting admins
    if (user.role === 'admin') {
      return errorResponse(res, 'Cannot delete admin users', 400);
    }

    await User.findByIdAndDelete(user._id);

    return successResponse(res, null, `User ${user.name} (${user.email}) deleted successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get password reset requests
// @route   GET /api/admin/users/password-requests
// @access  Admin
const getPasswordResetRequests = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';

    const requests = await PasswordResetRequest.find({ status })
      .sort({ createdAt: -1 });

    return successResponse(res, { requests }, 'Password reset requests retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Process password reset request
// @route   PUT /api/admin/users/password-requests/:id
// @access  Admin
const processPasswordReset = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return errorResponse(res, 'Passwords do not match', 400);
    }

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return errorResponse(res, 'Password reset request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'This request has already been processed', 400);
    }

    // Update user password
    const user = await User.findById(request.user._id || request.user);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    user.password = newPassword;
    user.passwordResetRequested = false;
    user.passwordResetRequestedAt = null;
    await user.save();

    // Update request status
    request.status = 'completed';
    request.completedBy = req.user._id;
    request.completedAt = new Date();
    await request.save();

    return successResponse(res, null, `Password reset for ${user.name} completed successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Reject password reset request
// @route   DELETE /api/admin/users/password-requests/:id
// @access  Admin
const rejectPasswordReset = async (req, res, next) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return errorResponse(res, 'Password reset request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'This request has already been processed', 400);
    }

    // Update user
    const user = await User.findById(request.user._id || request.user);
    if (user) {
      user.passwordResetRequested = false;
      user.passwordResetRequestedAt = null;
      await user.save();
    }

    // Update request status
    request.status = 'rejected';
    request.completedBy = req.user._id;
    request.completedAt = new Date();
    await request.save();

    return successResponse(res, null, 'Password reset request rejected');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  deleteUser,
  deleteUserByEmail,
  getPasswordResetRequests,
  processPasswordReset,
  rejectPasswordReset
};
