require('dotenv').config();
const mongoose = require('mongoose');

const ChargePoint = require('../models/ChargePoint');
const Transaction = require('../models/Transaction');
const MeterValue = require('../models/MeterValue');
const OcppMessage = require('../models/OcppMessage');
const StatusLog = require('../models/StatusLog');

// Mapping from old generated names → new professional names
// We keep CP001 as the real production one
const renameMap = {
  'cp_1':  'CP002',
  'cp_2':  'CP003',
  'cp_3':  'CP004',
  'cp_4':  'CP005',
  'cp_5':  'CP006',
  'cp_6':  'CP007',
  'cp_7':  'CP008',
  'cp_8':  'CP009',
  'cp_9':  'CP010',
  'cp_10': 'CP011'
};

async function renameChargePoints() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not defined in your .env file!');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { 
      serverSelectionTimeoutMS: 10000 
    });
    console.log('✅ Connected to MongoDB successfully');

    // First, check what we actually have
    const existingOld = await ChargePoint.find({ 
      chargePointId: { $in: Object.keys(renameMap) } 
    }, { chargePointId: 1 });

    console.log('\n📋 Found old charge points to rename:', existingOld.map(c => c.chargePointId));

    if (existingOld.length === 0) {
      console.log('⚠️  No old cp_1 to cp_10 found. They may have already been renamed or never existed.');
      const current = await ChargePoint.find({}, { chargePointId: 1 }).sort({ chargePointId: 1 });
      console.log('Current charge points:', current.map(c => c.chargePointId));
      return;
    }

    for (const [oldId, newId] of Object.entries(renameMap)) {
      console.log(`\n🔄 Processing ${oldId} → ${newId} ...`);

      // Rename the ChargePoint itself
      const cpResult = await ChargePoint.updateOne(
        { chargePointId: oldId },
        { $set: { chargePointId: newId } }
      );
      console.log(`   → ChargePoint collection: ${cpResult.modifiedCount} document(s) renamed`);

      // Update all linked data
      const txnResult = await Transaction.updateMany({ chargePointId: oldId }, { $set: { chargePointId: newId } });
      const mvResult = await MeterValue.updateMany({ chargePointId: oldId }, { $set: { chargePointId: newId } });
      const statusResult = await StatusLog.updateMany({ chargePointId: oldId }, { $set: { chargePointId: newId } });
      const msgResult = await OcppMessage.updateMany({ chargePointId: oldId }, { $set: { chargePointId: newId } });

      console.log(`   → Transactions: ${txnResult.modifiedCount} | MeterValues: ${mvResult.modifiedCount} | StatusLogs: ${statusResult.modifiedCount} | OcppMessages: ${msgResult.modifiedCount}`);
    }

    console.log('\n✅ Rename process finished!');

    // Final verification
    const all = await ChargePoint.find({}, { chargePointId: 1, _id: 0 }).sort({ chargePointId: 1 });
    console.log('\n📋 FINAL LIST OF CHARGE POINTS IN DATABASE:');
    console.log(all.map(c => c.chargePointId));

  } catch (error) {
    console.error('\n❌ FATAL ERROR during rename:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect().catch(() => {});
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

renameChargePoints();
