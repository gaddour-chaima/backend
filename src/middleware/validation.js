const { query, param } = require('express-validator');

// Validation rules for common parameters
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const validateSorting = [
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc'])
];

const validateDateRange = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

const validateChargePointId = [
  param('chargePointId').isString().notEmpty()
];

const validateTransactionId = [
  param('transactionId').isInt({ min: 1 }).toInt()
];

const validateMessageId = [
  param('id').isMongoId()
];

const validateStatus = [
  query('status').optional().isIn(['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'])
];

const validateAction = [
  query('action').optional().isString()
];

const validateDirection = [
  query('direction').optional().isIn(['in', 'out'])
];

module.exports = {
  validatePagination,
  validateSorting,
  validateDateRange,
  validateChargePointId,
  validateTransactionId,
  validateMessageId,
  validateStatus,
  validateAction,
  validateDirection
};