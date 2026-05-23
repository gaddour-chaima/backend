require('dotenv').config();
const mongoose = require('mongoose');
const ChargePoint = require('../models/ChargePoint');
const Transaction = require('../models/Transaction');
const MeterValue = require('../models/MeterValue');
const OcppMessage = require('../models/OcppMessage');
const StatusLog = require('../models/StatusLog');

// Demo charge points (starting from CP002 because CP001 is the real/production one)
const chargePointIds = Array.from({length: 10}, (_, i) => `CP${String(i + 2).padStart(3, '0')}`); // CP002 to CP011

// Number of transactions per charge point
const transactionsPerCP = 100;

// Function to generate random date in the past
function randomDate(daysAgo) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past;
}

async function generateData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Only clear demo data (CP002–CP011). Never delete real production data (CP001 and above)
    const demoIds = chargePointIds;
    await ChargePoint.deleteMany({ chargePointId: { $in: demoIds } });
    await Transaction.deleteMany({ chargePointId: { $in: demoIds } });
    await MeterValue.deleteMany({ chargePointId: { $in: demoIds } });
    await OcppMessage.deleteMany({ chargePointId: { $in: demoIds } });
    await StatusLog.deleteMany({ chargePointId: { $in: demoIds } });
    console.log('Cleared only demo charge points (CP002–CP011). Real data (CP001) is safe.');

    // Ensure demo charge points exist (with pricing) - CP001 is real and untouched
    for (const id of chargePointIds) {
      const pricePerKWh = Number((0.15 + Math.random() * 0.20).toFixed(2)); // 0.15 - 0.35 €/kWh
      await ChargePoint.findOneAndUpdate(
        { chargePointId: id },
        {
          chargePointId: id,
          vendor: 'VendorX',
          model: 'ModelY',
          status: 'Available',
          lastSeen: new Date(),
          pricePerKWh
        },
        { upsert: true, new: true }
      );
    }
    console.log('Charge points ensured');

    // Generate transactions
    for (const cpId of chargePointIds) {
      for (let i = 0; i < transactionsPerCP; i++) {
        const startTime = randomDate(30);
        const duration = Math.random() * 8 + 1; // 1-9 hours
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        const energy = Math.random() * 50 + 10; // 10-60 kWh
        const status = Math.random() > 0.1 ? 'Completed' : 'Failed';
        const connectorId = Math.floor(Math.random() * 2) + 1; // 1 or 2
        const idTag = `tag_${Math.floor(Math.random() * 1000)}`;

        const startMeter = Math.floor(Math.random() * 10000); // Random start meter
        const stopMeter = status === 'Completed' ? startMeter + energy * 1000 : null;

        // Use the charge point's price (we just set it above)
        const cpDoc = await ChargePoint.findOne({ chargePointId: cpId });
        const pricePerKWh = cpDoc?.pricePerKWh ?? 0.20;
        const cost = status === 'Completed' ? Number((energy * pricePerKWh).toFixed(2)) : null;

        const transaction = new Transaction({
          transactionId: Date.now() + Math.random(), // Unique ID
          chargePointId: cpId,
          connectorId,
          idTag,
          startTime,
          stopTime: status === 'Completed' ? endTime : null,
          startMeter,
          stopMeter,
          energyConsumedWh: status === 'Completed' ? energy * 1000 : 0,
          stopReason: status === 'Completed' ? 'EVDisconnected' : null,
          status,
          pricePerKWh,
          cost
        });

        await transaction.save();

        // Generate meter values every 15 minutes during the transaction
        if (status === 'Completed') {
          const start = new Date(startTime);
          const end = new Date(endTime);
          let currentEnergy = 0;
          for (let time = start; time <= end; time.setMinutes(time.getMinutes() + 15)) {
            const voltage = 230 + Math.random() * 10;
            const current = Math.random() * 20 + 10;
            const power = voltage * current;
            currentEnergy += (power * 0.25) / 1000; // kWh

            const meterValue = new MeterValue({
              chargePointId: cpId,
              connectorId,
              transactionId: transaction.transactionId,
              timestamp: new Date(time),
              voltage,
              current,
              power,
              energyWh: currentEnergy * 1000
            });

            await meterValue.save();
          }
        }
      }
    }

    // Generate OCPP messages and status logs
    const ocppActions = ['BootNotification', 'StatusNotification', 'Heartbeat', 'MeterValues', 'StartTransaction', 'StopTransaction'];
    const statuses = ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'];
    const errorCodes = ['NoError', 'ConnectorLockFailure', 'EVCommunicationError', 'GroundFailure', 'HighTemperature', 'InternalError'];

    for (const cpId of chargePointIds) {
      // Generate 50 messages per CP
      for (let i = 0; i < 50; i++) {
        const action = ocppActions[Math.floor(Math.random() * ocppActions.length)];
        const message = new OcppMessage({
          chargePointId: cpId,
          messageTypeId: Math.random() > 0.5 ? 2 : 3, // Request or Response
          uniqueId: `msg_${Date.now()}_${Math.random()}`,
          action,
          payload: { simulated: true, data: `Sample payload for ${action}` },
          direction: Math.random() > 0.5 ? 'in' : 'out',
          receivedAt: randomDate(30)
        });
        await message.save();
      }

      // Generate 20 status logs per CP
      for (let i = 0; i < 20; i++) {
        const statusLog = new StatusLog({
          chargePointId: cpId,
          connectorId: Math.floor(Math.random() * 2) + 1,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          errorCode: errorCodes[Math.floor(Math.random() * errorCodes.length)],
          timestamp: randomDate(30)
        });
        await statusLog.save();
      }
    }

    console.log('Data generation complete');

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

generateData();