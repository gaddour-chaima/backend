const express = require('express');
const {
  getTransactions,
  getTransaction,
  getTransactionSummary
} = require('../controllers/transactionController');
const {
  validatePagination,
  validateSorting,
  validateTransactionId,
  validateStatus,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

router.route('/')
  .get(
    validatePagination,
    validateSorting,
    validateStatus,
    validateDateRange,
    getTransactions
  );

router.route('/:transactionId')
  .get(validateTransactionId, getTransaction);

router.route('/summary/overview')
  .get(getTransactionSummary);

module.exports = router;