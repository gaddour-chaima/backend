const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate JWT Token
  static generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });
  }

  // Register new user
  static async register(userData) {
    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'viewer'
    });

    // Generate token
    const token = this.generateToken(user._id);

    // Return user data without password and token
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    return {
      user: userResponse,
      token
    };
  }

  // Login user
  static async login(credentials) {
    const { email, password } = credentials;

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = this.generateToken(user._id);

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    return {
      user: userResponse,
      token
    };
  }

  // Get current user profile
  static async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    const { name, email, currentPassword, newPassword } = updateData;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        throw new Error('Current password is required to set new password');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
    }

    // Update other fields
    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new Error('Email is already taken');
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    // Return updated user data without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  // Verify token (for testing purposes)
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (err) {
      return null;
    }
  }
}

module.exports = AuthService;