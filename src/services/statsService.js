const ChargePoint = require('../models/ChargePoint');
const Transaction = require('../models/Transaction');
const MeterValue = require('../models/MeterValue');
const { parseDateRange } = require('../utils/date');

class StatsService {
  static async getOverviewStats() {
    const [chargePointStats, transactionStats] = await Promise.all([
      this.getChargePointStats(),
      this.getTransactionStats()
    ]);

    return {
      totalChargePoints: chargePointStats.totalChargePoints,
      onlineChargePoints: chargePointStats.onlineChargePoints,
      offlineChargePoints: chargePointStats.offlineChargePoints,
      chargingChargePoints: chargePointStats.chargingChargePoints,
      totalTransactions: transactionStats.totalTransactions,
      activeTransactions: transactionStats.activeTransactions,
      totalEnergy: transactionStats.totalEnergy,
      avgEnergyPerSession: transactionStats.avgEnergyPerSession
    };
  }

  static async getChargePointStats() {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ];

    const statusDistribution = await ChargePoint.aggregate(pipeline);

    const totalChargePoints = await ChargePoint.countDocuments();
    const onlineChargePoints = await ChargePoint.countDocuments({
      status: { $in: ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved'] }
    });
    const chargingChargePoints = await ChargePoint.countDocuments({
      status: 'Charging'
    });

    return {
      totalChargePoints,
      onlineChargePoints,
      offlineChargePoints: totalChargePoints - onlineChargePoints,
      chargingChargePoints,
      statusDistribution
    };
  }

  static async getTransactionStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          activeTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          totalEnergy: { $sum: { $divide: ['$energyConsumedWh', 1000] } } // Convert Wh to kWh
        }
      },
      {
        $project: {
          _id: 0,
          totalTransactions: 1,
          activeTransactions: 1,
          totalEnergy: 1,
          avgEnergyPerSession: {
            $cond: {
              if: { $gt: ['$totalTransactions', 0] },
              then: { $divide: ['$totalEnergy', '$totalTransactions'] },
              else: 0
            }
          }
        }
      }
    ];

    const result = await Transaction.aggregate(pipeline);
    return result[0] || {
      totalTransactions: 0,
      activeTransactions: 0,
      totalEnergy: 0,
      avgEnergyPerSession: 0
    };
  }

  static async getDailyEnergyStats(startDate, endDate) {
    const { start, end } = parseDateRange(startDate, endDate);

    const pipeline = [
      {
        $match: {
          timestamp: {
            $gte: start || new Date('1970-01-01'),
            $lte: end || new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalEnergy: { $sum: { $divide: ['$energyWh', 1000] } } // kWh
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $project: {
          date: '$_id',
          energy: '$totalEnergy',
          _id: 0
        }
      }
    ];

    return await MeterValue.aggregate(pipeline);
  }

  static async getMonthlyEnergyStats(startDate, endDate) {
    const { start, end } = parseDateRange(startDate, endDate);

    const pipeline = [
      {
        $match: {
          timestamp: {
            $gte: start || new Date('1970-01-01'),
            $lte: end || new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$timestamp' }
          },
          totalEnergy: { $sum: { $divide: ['$energyWh', 1000] } } // kWh
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $project: {
          date: '$_id',
          energy: '$totalEnergy',
          _id: 0
        }
      }
    ];

    return await MeterValue.aggregate(pipeline);
  }

  static async getDailySessionStats(startDate, endDate) {
    const { start, end } = parseDateRange(startDate, endDate);

    const pipeline = [
      {
        $match: {
          startTime: {
            $gte: start || new Date('1970-01-01'),
            $lte: end || new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $project: {
          date: '$_id',
          sessions: '$count',
          _id: 0
        }
      }
    ];

    return await Transaction.aggregate(pipeline);
  }

  static async getRealtimePowerStats() {
    const pipeline = [
      {
        $match: { power: { $ne: null } }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $limit: 50 // Last 50 readings
      },
      {
        $project: {
          timestamp: 1,
          power: 1,
          _id: 0
        }
      }
    ];

    return await MeterValue.aggregate(pipeline);
  }

  static async getStatusDistribution() {
    return await this.getChargePointStats().then(stats => stats.statusDistribution);
  }

  static async getAvailabilityStats() {
    // Simplified availability calculation based on status logs
    // In a real implementation, you'd calculate uptime based on heartbeats and status changes
    const onlineCount = await ChargePoint.countDocuments({
      status: { $in: ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved'] }
    });
    const totalCount = await ChargePoint.countDocuments();

    const availability = totalCount > 0 ? (onlineCount / totalCount) * 100 : 0;

    return {
      availabilityPercentage: Math.round(availability * 100) / 100,
      onlineChargePoints: onlineCount,
      totalChargePoints: totalCount
    };
  }
}

module.exports = StatsService;