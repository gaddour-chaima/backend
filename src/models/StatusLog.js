const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
  chargePointId: {
    type: String,
    required: true,
    index: true
  },
  connectorId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
    required: true
  },
  errorCode: {
    type: String,
    enum: ['ConnectorLockFailure', 'EVCommunicationError', 'GroundFailure', 'HighTemperature', 'InternalError', 'LocalListConflict', 'NoError', 'OtherError', 'OverCurrentFailure', 'OverVoltage', 'PowerMeterFailure', 'PowerSwitchFailure', 'ReaderFailure', 'ResetFailure', 'UnderVoltage', 'WeakSignal'],
    default: 'NoError'
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

statusLogSchema.index({ chargePointId: 1, timestamp: -1 });
statusLogSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('StatusLog', statusLogSchema);