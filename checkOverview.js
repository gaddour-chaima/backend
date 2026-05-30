const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocpp_dashboard', { useNewUrlParser: true, useUnifiedTopology: true });
const StatsService = require('./src/services/statsService');
StatsService.getOverviewStats().then(stats => {
  console.log('Stats from getOverviewStats:', stats);
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});