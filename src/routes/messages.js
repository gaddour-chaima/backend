const express = require('express');
const {
  getMessages,
  getMessage
} = require('../controllers/messageController');
const {
  validatePagination,
  validateSorting,
  validateMessageId,
  validateAction,
  validateDirection,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

router.route('/')
  .get(
    validatePagination,
    validateSorting,
    validateAction,
    validateDirection,
    validateDateRange,
    getMessages
  );

router.route('/:id')
  .get(validateMessageId, getMessage);

module.exports = router;