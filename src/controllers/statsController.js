const asyncHandler = require('../middleware/async');
const StatsService = require('../services/statsService');
const ApiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// @desc    Get overview statistics
// @route   GET /api/stats/overview
// @access  Public
const getOverviewStats = asyncHandler(async (req, res) => {
  const stats = await StatsService.getOverviewStats();
  ApiResponse.success(res, 'Overview stats retrieved successfully', stats);
});

// @desc    Get daily energy statistics
// @route   GET /api/stats/energy/daily
// @access  Public
const getDailyEnergyStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await StatsService.getDailyEnergyStats(startDate, endDate);
  ApiResponse.success(res, 'Daily energy stats retrieved successfully', stats);
});

// @desc    Get monthly energy statistics
// @route   GET /api/stats/energy/monthly
// @access  Public
const getMonthlyEnergyStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await StatsService.getMonthlyEnergyStats(startDate, endDate);
  ApiResponse.success(res, 'Monthly energy stats retrieved successfully', stats);
});

// @desc    Get daily session statistics
// @route   GET /api/stats/sessions/daily
// @access  Public
const getDailySessionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await StatsService.getDailySessionStats(startDate, endDate);
  ApiResponse.success(res, 'Daily session stats retrieved successfully', stats);
});

// @desc    Get realtime power statistics
// @route   GET /api/stats/power/realtime
// @access  Public
const getRealtimePowerStats = asyncHandler(async (req, res) => {
  const stats = await StatsService.getRealtimePowerStats();
  ApiResponse.success(res, 'Realtime power stats retrieved successfully', stats);
});

// @desc    Get status distribution
// @route   GET /api/stats/status/distribution
// @access  Public
const getStatusDistribution = asyncHandler(async (req, res) => {
  const stats = await StatsService.getStatusDistribution();
  ApiResponse.success(res, 'Status distribution retrieved successfully', stats);
});

// @desc    Get availability statistics
// @route   GET /api/stats/availability
// @access  Public
const getAvailabilityStats = asyncHandler(async (req, res) => {
  const stats = await StatsService.getAvailabilityStats();
  ApiResponse.success(res, 'Availability stats retrieved successfully', stats);
});

module.exports = {
  getOverviewStats,
  getDailyEnergyStats,
  getMonthlyEnergyStats,
  getDailySessionStats,
  getRealtimePowerStats,
  getStatusDistribution,
  getAvailabilityStats
};