const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../middleware/async');
const AuthService = require('../services/authService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const result = await AuthService.register({
    name,
    email,
    password,
    role
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.login({
    email,
    password
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await AuthService.getProfile(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  const updatedUser = await AuthService.updateProfile(req.user._id, {
    name,
    email,
    currentPassword,
    newPassword
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'operator', 'viewer'])
    .withMessage('Role must be admin, operator, or viewer')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('currentPassword')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Current password is required when changing password'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, updateProfile);

module.exports = router;