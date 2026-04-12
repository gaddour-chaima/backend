const asyncHandler = require('../middleware/async');
const TransactionService = require('../services/transactionService');
const ApiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Public
const getTransactions = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { page, limit, sortBy, sortOrder, status, startDate, endDate } = req.query;
  const filters = { status, startDate, endDate };
  const pagination = { page, limit };
  const sorting = { sortBy, sortOrder };

  const result = await TransactionService.getTransactions(filters, pagination, sorting);
  ApiResponse.success(res, 'Transactions retrieved successfully', result.transactions, result.meta);
});

// @desc    Get single transaction
// @route   GET /api/transactions/:transactionId
// @access  Public
const getTransaction = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
  }

  const { transactionId } = req.params;
  const transaction = await TransactionService.getTransactionById(transactionId);

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', [], 404);
  }

  ApiResponse.success(res, 'Transaction retrieved successfully', transaction);
});

// @desc    Get transaction summary
// @route   GET /api/transactions/summary/overview
// @access  Public
const getTransactionSummary = asyncHandler(async (req, res) => {
  const summary = await TransactionService.getTransactionSummary();
  ApiResponse.success(res, 'Transaction summary retrieved successfully', summary);
});

module.exports = {
  getTransactions,
  getTransaction,
  getTransactionSummary
};