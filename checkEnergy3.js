const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocpp_dashboard', { useNewUrlParser: true, useUnifiedTopology: true });
const Transaction = require('./src/models/Transaction');
Transaction.findOne({ transactionId: 1002 }).then(doc => {
  if (doc) {
    console.log('Transaction 1002:', doc);
    console.log('energyConsumedWh:', doc.energyConsumedWh);
    console.log('This should be in Wh. If the energy is 1.30 kWh, then energyConsumedWh should be 1300.');
  } else {
    console.log('Transaction 1002 not found');
  }
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});