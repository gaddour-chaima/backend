const mongoose = require('mongoose');

const chargePointSchema = new mongoose.Schema({
  chargePointId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  vendor: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  firmwareVersion: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
    default: 'Unavailable'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // Settings & limits (configured per charge point)
  maxCurrent: {
    type: Number,
    default: 32
  },
  maxEnergy: {
    type: Number,
    default: 22
  },
  // Pricing
  pricePerKWh: {
    type: Number,
    default: 0.20
  }
}, {
  timestamps: true
});

chargePointSchema.index({ status: 1 });
chargePointSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('ChargePoint', chargePointSchema);