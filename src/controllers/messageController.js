const asyncHandler = require('../middleware/async');
const MessageService = require('../services/messageService');
const ApiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// @desc    Get all messages
// @route   GET /api/messages
// @access  Public
const getMessages = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { page, limit, sortBy, sortOrder, action, chargePointId, direction, startDate, endDate } = req.query;
  const filters = { action, chargePointId, direction, startDate, endDate };
  const pagination = { page, limit };
  const sorting = { sortBy, sortOrder };

  const result = await MessageService.getMessages(filters, pagination, sorting);
  ApiResponse.success(res, 'Messages retrieved successfully', result.messages, result.meta);
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Public
const getMessage = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { id } = req.params;
  const message = await MessageService.getMessageById(id);

  if (!message) {
    return ApiResponse.error(res, 'Message not found', [], 404);
  }

  ApiResponse.success(res, 'Message retrieved successfully', message);
});

module.exports = {
  getMessages,
  getMessage
};