const express = require('express');
const {
  getOverviewStats,
  getDailyEnergyStats,
  getMonthlyEnergyStats,
  getDailySessionStats,
  getRealtimePowerStats,
  getStatusDistribution,
  getAvailabilityStats
} = require('../controllers/statsController');
const { validateDateRange } = require('../middleware/validation');

const router = express.Router();

router.route('/overview').get(getOverviewStats);
router.route('/energy/daily').get(validateDateRange, getDailyEnergyStats);
router.route('/energy/monthly').get(validateDateRange, getMonthlyEnergyStats);
router.route('/sessions/daily').get(validateDateRange, getDailySessionStats);
router.route('/power/realtime').get(getRealtimePowerStats);
router.route('/status/distribution').get(getStatusDistribution);
router.route('/availability').get(getAvailabilityStats);

module.exports = router;