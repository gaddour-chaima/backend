const express = require('express');
const {
  getChargePoints,
  getChargePoint,
  getChargePointStatusHistory,
  getChargePointMeterValues,
  getChargePointTransactions
} = require('../controllers/chargePointController');
const {
  validatePagination,
  validateSorting,
  validateChargePointId,
  validateStatus,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

router.route('/')
  .get(
    validatePagination,
    validateSorting,
    validateStatus,
    getChargePoints
  );

router.route('/:chargePointId')
  .get(validateChargePointId, getChargePoint);

router.route('/:chargePointId/status-history')
  .get(
    validateChargePointId,
    validatePagination,
    validateSorting,
    getChargePointStatusHistory
  );

router.route('/:chargePointId/meter-values')
  .get(
    validateChargePointId,
    validatePagination,
    validateSorting,
    validateDateRange,
    getChargePointMeterValues
  );

router.route('/:chargePointId/transactions')
  .get(
    validateChargePointId,
    validatePagination,
    validateSorting,
    getChargePointTransactions
  );

module.exports = router;