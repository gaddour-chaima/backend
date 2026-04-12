const asyncHandler = require('../middleware/async');
const HealthService = require('../services/healthService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get health status
// @route   GET /api/health
// @access  Public
const getHealth = asyncHandler(async (req, res) => {
  const health = await HealthService.getHealthStatus();
  ApiResponse.success(res, 'Health check successful', health);
});

module.exports = {
  getHealth
};