const express = require('express');
const {
  getEnergyForecast,
  getAnomalyDetection
} = require('../controllers/aiController');

const router = express.Router();

router.route('/forecast-energy').get(getEnergyForecast);
router.route('/anomaly-detection').get(getAnomalyDetection);

module.exports = router;