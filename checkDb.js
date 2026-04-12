require('dotenv').config();
const mongoose = require('mongoose');
const ChargePoint = require('./src/models/ChargePoint');
const Transaction = require('./src/models/Transaction');
const MeterValue = require('./src/models/MeterValue');
const OcppMessage = require('./src/models/OcppMessage');
const StatusLog = require('./src/models/StatusLog');

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const cps = await ChargePoint.find({}, 'chargePointId');
    console.log('Charge points:', cps.map(cp => cp.chargePointId));

    const txnCount = await Transaction.countDocuments();
    const meterCount = await MeterValue.countDocuments();
    const msgCount = await OcppMessage.countDocuments();
    const statusCount = await StatusLog.countDocuments();
    console.log(`Total transactions: ${txnCount}`);
    console.log(`Total meter values: ${meterCount}`);
    console.log(`Total OCPP messages: ${msgCount}`);
    console.log(`Total status logs: ${statusCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDb();