const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  chargePointId: {
    type: String,
    required: true,
    index: true
  },
  connectorId: {
    type: Number,
    required: true
  },
  idTag: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  stopTime: {
    type: Date,
    default: null
  },
  startMeter: {
    type: Number,
    default: 0
  },
  stopMeter: {
    type: Number,
    default: null
  },
  energyConsumedWh: {
    type: Number,
    default: 0
  },
  stopReason: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Failed', 'Cancelled'],
    default: 'Active'
  }
}, {
  timestamps: true
});

transactionSchema.index({ chargePointId: 1, startTime: -1 });
transactionSchema.index({ status: 1, startTime: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);