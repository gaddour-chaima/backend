const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocpp_dashboard', { useNewUrlParser: true, useUnifiedTopology: true });
const TransactionService = require('./src/services/transactionService');
TransactionService.getTransactionSummary().then(summary => {
  console.log('Transaction summary:', summary);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});