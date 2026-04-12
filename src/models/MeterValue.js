const mongoose = require('mongoose');

const meterValueSchema = new mongoose.Schema({
  chargePointId: {
    type: String,
    required: true,
    index: true
  },
  connectorId: {
    type: Number,
    required: true
  },
  transactionId: {
    type: Number,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  voltage: {
    type: Number,
    default: null
  },
  current: {
    type: Number,
    default: null
  },
  power: {
    type: Number,
    default: null
  },
  energyWh: {
    type: Number,
    default: null
  },
  raw: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

meterValueSchema.index({ chargePointId: 1, timestamp: -1 });
meterValueSchema.index({ transactionId: 1, timestamp: -1 });

module.exports = mongoose.model('MeterValue', meterValueSchema);