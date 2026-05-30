const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocpp_dashboard', { useNewUrlParser: true, useUnifiedTopology: true });
const Transaction = require('./src/models/Transaction');
const energyAggregation = Transaction.aggregate([
  {
    $group: {
      _id: null,
      totalEnergyWh: { $sum: '$energyConsumedWh' },
      totalTransactions: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      totalEnergy: { $divide: ['$totalEnergyWh', 1000] },
      avgEnergyPerSession: {
        $cond: {
          if: { $gt: ['$totalTransactions', 0] },
          then: { $divide: [{ $divide: ['$totalEnergyWh', 1000] }, '$totalTransactions'] },
          else: 0
        }
      }
    }
  }
]);
energyAggregation.then(result => {
  console.log('Aggregation result:', result);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});