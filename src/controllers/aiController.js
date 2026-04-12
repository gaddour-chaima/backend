const asyncHandler = require('../middleware/async');
const AIService = require('../services/aiService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get energy forecast
// @route   GET /api/ai/forecast-energy
// @access  Public
const getEnergyForecast = asyncHandler(async (req, res) => {
  const forecast = await AIService.forecastEnergy();
  ApiResponse.success(res, 'Energy forecast retrieved successfully', forecast);
});

// @desc    Get anomaly detection
// @route   GET /api/ai/anomaly-detection
// @access  Public
const getAnomalyDetection = asyncHandler(async (req, res) => {
  const anomalies = await AIService.detectAnomalies();
  ApiResponse.success(res, 'Anomaly detection completed', anomalies);
});

module.exports = {
  getEnergyForecast,
  getAnomalyDetection
};