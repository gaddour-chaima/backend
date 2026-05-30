const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocpp_dashboard', { useNewUrlParser: true, useUnifiedTopology: true });
const Transaction = require('./src/models/Transaction');
Transaction.aggregate([{$group:{_id:null, totalEnergyWh:{$sum:'$energyConsumedWh'}, count:{$sum:1}}}]).then(result => {
  console.log('Result:', result);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});