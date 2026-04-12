const mongoose = require('mongoose');

const ocppMessageSchema = new mongoose.Schema({
  chargePointId: {
    type: String,
    required: true,
    index: true
  },
  messageTypeId: {
    type: Number,
    required: true
  },
  uniqueId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  direction: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ocppMessageSchema.index({ chargePointId: 1, receivedAt: -1 });
ocppMessageSchema.index({ action: 1, receivedAt: -1 });

module.exports = mongoose.model('OcppMessage', ocppMessageSchema);