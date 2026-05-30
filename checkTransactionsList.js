const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocpp_dashboard', { useNewUrlParser: true, useUnifiedTopology: true });
const TransactionService = require('./src/services/transactionService');
TransactionService.getTransactions({},{},{}).then(result => {
  console.log('Number of transactions:', result.transactions.length);
  if (result.transactions.length > 0) {
    console.log('First transaction energyConsumed:', result.transactions[0].energyConsumed, 'Wh');
    console.log('Expected around 1301 Wh for transaction 1002?');
  }
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});