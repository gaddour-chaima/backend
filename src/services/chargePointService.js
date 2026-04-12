const ChargePoint = require('../models/ChargePoint');
const StatusLog = require('../models/StatusLog');
const MeterValue = require('../models/MeterValue');
const Transaction = require('../models/Transaction');
const { getPagination, getSorting, getMeta } = require('../utils/pagination');
const { parseDateRange } = require('../utils/date');

class ChargePointService {
  static async getChargePoints(filters = {}, pagination = {}, sorting = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { sortBy = 'createdAt', sortOrder = 'desc' } = sorting;
    const { status, search } = filters;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { chargePointId: new RegExp(search, 'i') },
        { vendor: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }

    const { skip, limit: limitNum } = getPagination(page, limit);
    const sort = getSorting(sortBy, sortOrder);

    const rawChargePoints = await ChargePoint.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Transform to match API spec
    const chargePoints = rawChargePoints.map(cp => ({
      id: cp.chargePointId,
      vendor: cp.vendor,
      model: cp.model,
      status: cp.status,
      firmwareVersion: cp.firmwareVersion,
      lastSeen: cp.lastSeen
    }));

    const total = await ChargePoint.countDocuments(query);
    const meta = getMeta(total, page, limit);

    return { chargePoints, meta };
  }

  static async getChargePointById(chargePointId) {
    const cp = await ChargePoint.findOne({ chargePointId });
    if (!cp) return null;
    return {
      id: cp.chargePointId,
      vendor: cp.vendor,
      model: cp.model,
      status: cp.status,
      firmwareVersion: cp.firmwareVersion,
      lastSeen: cp.lastSeen
    };
  }

  static async getStatusHistory(chargePointId, pagination = {}, sorting = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { sortBy = 'timestamp', sortOrder = 'desc' } = sorting;

    const { skip, limit: limitNum } = getPagination(page, limit);
    const sort = getSorting(sortBy, sortOrder);

    const statusLogs = await StatusLog.find({ chargePointId })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await StatusLog.countDocuments({ chargePointId });
    const meta = getMeta(total, page, limit);

    return { statusLogs, meta };
  }

  static async getMeterValues(chargePointId, filters = {}, pagination = {}, sorting = {}) {
    const { page = 1, limit = 50 } = pagination; // Increase limit for more data points
    const { sortBy = 'timestamp', sortOrder = 'desc' } = sorting;
    const { startDate, endDate } = filters;

    const query = { chargePointId };
    const { start, end } = parseDateRange(startDate, endDate);
    if (start) query.timestamp = { $gte: start };
    if (end) query.timestamp = { ...query.timestamp, $lte: end };

    const { skip, limit: limitNum } = getPagination(page, limit);
    const sort = getSorting(sortBy, sortOrder);

    const rawMeterValues = await MeterValue.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Transform to frontend expected format
    const meterValues = [];
    rawMeterValues.forEach(mv => {
      if (mv.voltage !== null) {
        meterValues.push({
          timestamp: mv.timestamp.toISOString(),
          value: mv.voltage,
          measurand: 'Voltage',
          unit: 'V'
        });
      }
      if (mv.current !== null) {
        meterValues.push({
          timestamp: mv.timestamp.toISOString(),
          value: mv.current,
          measurand: 'Current',
          unit: 'A'
        });
      }
      if (mv.power !== null) {
        meterValues.push({
          timestamp: mv.timestamp.toISOString(),
          value: mv.power,
          measurand: 'Power',
          unit: 'W'
        });
      }
      if (mv.energyWh !== null) {
        meterValues.push({
          timestamp: mv.timestamp.toISOString(),
          value: mv.energyWh,
          measurand: 'Energy',
          unit: 'Wh'
        });
      }
    });

    const total = await MeterValue.countDocuments(query);
    const meta = getMeta(total, page, limit);

    return { meterValues, meta };
  }

  static async getTransactions(chargePointId, pagination = {}, sorting = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { sortBy = 'startTime', sortOrder = 'desc' } = sorting;

    const { skip, limit: limitNum } = getPagination(page, limit);
    const sort = getSorting(sortBy, sortOrder);

    const rawTransactions = await Transaction.find({ chargePointId })
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

    const total = await Transaction.countDocuments({ chargePointId });
    const meta = getMeta(total, page, limit);

    return { transactions, meta };
  }
}

module.exports = ChargePointService;