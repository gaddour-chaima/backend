const asyncHandler = require('../middleware/async');
const ChargePointService = require('../services/chargePointService');
const ApiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// @desc    Get all charge points
// @route   GET /api/charge-points
// @access  Public
const getChargePoints = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { page, limit, sortBy, sortOrder, status, search } = req.query;
  const filters = { status, search };
  const pagination = { page, limit };
  const sorting = { sortBy, sortOrder };

  const result = await ChargePointService.getChargePoints(filters, pagination, sorting);
  ApiResponse.success(res, 'Charge points retrieved successfully', result.chargePoints, result.meta);
});

// @desc    Get single charge point
// @route   GET /api/charge-points/:chargePointId
// @access  Public
const getChargePoint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { chargePointId } = req.params;
  const chargePoint = await ChargePointService.getChargePointById(chargePointId);

  if (!chargePoint) {
    return ApiResponse.error(res, 'Charge point not found', [], 404);
  }

  ApiResponse.success(res, 'Charge point retrieved successfully', chargePoint);
});

// @desc    Get charge point status history
// @route   GET /api/charge-points/:chargePointId/status-history
// @access  Public
const getChargePointStatusHistory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { chargePointId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;
  const pagination = { page, limit };
  const sorting = { sortBy, sortOrder };

  const result = await ChargePointService.getStatusHistory(chargePointId, pagination, sorting);
  ApiResponse.success(res, 'Status history retrieved successfully', result.statusLogs, result.meta);
});

// @desc    Get charge point meter values
// @route   GET /api/charge-points/:chargePointId/meter-values
// @access  Public
const getChargePointMeterValues = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { chargePointId } = req.params;
  const { page, limit, sortBy, sortOrder, startDate, endDate } = req.query;
  const filters = { startDate, endDate };
  const pagination = { page, limit };
  const sorting = { sortBy, sortOrder };

  const result = await ChargePointService.getMeterValues(chargePointId, filters, pagination, sorting);
  ApiResponse.success(res, 'Meter values retrieved successfully', result.meterValues, result.meta);
});

// @desc    Get charge point transactions
// @route   GET /api/charge-points/:chargePointId/transactions
// @access  Public
const getChargePointTransactions = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { chargePointId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;
  const pagination = { page, limit };
  const sorting = { sortBy, sortOrder };

  const result = await ChargePointService.getTransactions(chargePointId, pagination, sorting);
  ApiResponse.success(res, 'Transactions retrieved successfully', result.transactions, result.meta);
});

module.exports = {
  getChargePoints,
  getChargePoint,
  getChargePointStatusHistory,
  getChargePointMeterValues,
  getChargePointTransactions
};