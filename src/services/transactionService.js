const Transaction = require('../models/Transaction');
const { getPagination, getSorting, getMeta } = require('../utils/pagination');
const { parseDateRange } = require('../utils/date');

class TransactionService {
  static async getTransactions(filters = {}, pagination = {}, sorting = {}) {
    const { page = 1, limit = 15 } = pagination; // Default to 15 for better infinite scrolling
    const { sortBy = 'startTime', sortOrder = 'desc' } = sorting;
    const { status, startDate, endDate } = filters;

    const query = {};
    // Status filter validation: case-insensitive regex matching
    // 'all' status shows all transactions without filtering
    // Map common variations to actual enum values
    if (status && status !== 'all') {
      let statusFilter = status;
      // Map common lowercase variations to actual enum values
      const statusMap = {
        'active': 'Active',
        'completed': 'Completed',
        'failed': 'Failed',
        'error': 'Failed', // Map 'error' to 'Failed'
        'cancelled': 'Cancelled',
        'stopped': 'Cancelled' // Map 'stopped' to 'Cancelled'
      };

      // If it's a known lowercase variation, use the mapped value
      if (statusMap[status.toLowerCase()]) {
        statusFilter = statusMap[status.toLowerCase()];
        query.status = statusFilter; // Exact match for mapped values
      } else {
        // Use regex for case-insensitive matching of other values
        query.status = { $regex: new RegExp("^" + status + "$", "i") };
      }
    }
    const { start, end } = parseDateRange(startDate, endDate);
    if (start) query.startTime = { $gte: start };
    if (end) query.startTime = { ...query.startTime, $lte: end };

    const { skip, limit: limitNum } = getPagination(page, limit);
    const sort = getSorting(sortBy, sortOrder);

    const rawTransactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Transform to match API spec
    const transactions = rawTransactions.map(t => ({
      id: t.transactionId,
      chargePointId: t.chargePointId,
      connectorId: t.connectorId,
      idTag: t.idTag,
      startTime: t.startTime,
      stopTime: t.stopTime,
      meterStart: t.startMeter,
      meterStop: t.stopMeter,
      stopReason: t.stopReason,
      status: t.status,
      energyConsumed: t.energyConsumedWh || (t.stopMeter && t.startMeter ? t.stopMeter - t.startMeter : 0)
    }));

    const total = await Transaction.countDocuments(query);
    const meta = getMeta(total, page, limit);

    return { transactions, meta };
  }

  static async getTransactionById(transactionId) {
    return await Transaction.findOne({ transactionId });
  }

  static async getTransactionSummary() {
    const pipeline = [
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          totalEnergy: { $sum: { $divide: ['$energyConsumedWh', 1000] } } // kWh
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          active: 1,
          completed: 1,
          totalEnergy: 1,
          avgEnergy: {
            $cond: {
              if: { $gt: ['$total', 0] },
              then: { $divide: ['$totalEnergy', '$total'] },
              else: 0
            }
          }
        }
      }
    ];

    const result = await Transaction.aggregate(pipeline);
    return result[0] || {
      total: 0,
      active: 0,
      completed: 0,
      totalEnergy: 0,
      avgEnergy: 0
    };
  }
}

module.exports = TransactionService;