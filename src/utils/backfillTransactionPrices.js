require('dotenv').config();
const mongoose = require('mongoose');

const ChargePoint = require('../models/ChargePoint');
const Transaction = require('../models/Transaction');

async function backfillTransactionPrices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all transactions that are missing pricePerKWh
    const transactionsToFix = await Transaction.find({
      $or: [
        { pricePerKWh: null },
        { pricePerKWh: { $exists: false } }
      ]
    });

    console.log(`Found ${transactionsToFix.length} transactions missing price information.`);

    if (transactionsToFix.length === 0) {
      console.log('✅ All transactions already have pricing data. Nothing to do.');
      return;
    }

    let updatedCount = 0;

    for (const tx of transactionsToFix) {
      // Get the current price from the charge point (after rename, they have nice IDs like CP002)
      const cp = await ChargePoint.findOne({ chargePointId: tx.chargePointId });

      if (!cp || typeof cp.pricePerKWh !== 'number') {
        console.warn(`⚠️  No price found for charge point ${tx.chargePointId} (tx ${tx.transactionId}). Skipping.`);
        continue;
      }

      const price = cp.pricePerKWh;
      tx.pricePerKWh = price;

      // If the transaction is completed and we have energy, compute the cost
      if (tx.status === 'Completed' && tx.energyConsumedWh != null) {
        const kWh = tx.energyConsumedWh / 1000;
        tx.cost = Number((kWh * price).toFixed(2));
      } else if (tx.status !== 'Completed') {
        // For active/failed transactions, at least store the rate that was active
        tx.cost = null;
      }

      await tx.save();
      updatedCount++;

      if (updatedCount % 50 === 0) {
        console.log(`   Updated ${updatedCount} transactions so far...`);
      }
    }

    console.log(`\n✅ Backfill complete! Updated ${updatedCount} transactions with pricePerKWh and cost.`);

    // Quick verification
    const stillMissing = await Transaction.countDocuments({
      $or: [{ pricePerKWh: null }, { pricePerKWh: { $exists: false } }]
    });
    console.log(`Transactions still missing price: ${stillMissing}`);

  } catch (error) {
    console.error('❌ Error during backfill:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

backfillTransactionPrices();
