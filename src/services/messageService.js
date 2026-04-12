const OcppMessage = require('../models/OcppMessage');
const { getPagination, getSorting, getMeta } = require('../utils/pagination');
const { parseDateRange } = require('../utils/date');

class MessageService {
  static async getMessages(filters = {}, pagination = {}, sorting = {}) {
    const { page = 1, limit = 10 } = pagination;
    const { sortBy = 'receivedAt', sortOrder = 'desc' } = sorting;
    const { action, chargePointId, direction, startDate, endDate } = filters;

    const query = {};
    if (action) query.action = action;
    if (chargePointId) query.chargePointId = chargePointId;
    if (direction) query.direction = direction;
    const { start, end } = parseDateRange(startDate, endDate);
    if (start) query.receivedAt = { $gte: start };
    if (end) query.receivedAt = { ...query.receivedAt, $lte: end };

    const { skip, limit: limitNum } = getPagination(page, limit);
    const sort = getSorting(sortBy, sortOrder);

    const rawMessages = await OcppMessage.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Transform to match API spec
    const messages = rawMessages.map(m => ({
      id: m._id,
      chargePointId: m.chargePointId,
      messageType: m.messageTypeId,
      action: m.action,
      direction: m.direction,
      payload: JSON.stringify(m.payload),
      timestamp: m.receivedAt
    }));

    const total = await OcppMessage.countDocuments(query);
    const meta = getMeta(total, page, limit);

    return { messages, meta };
  }

  static async getMessageById(id) {
    const m = await OcppMessage.findById(id);
    if (!m) return null;
    return {
      id: m._id,
      chargePointId: m.chargePointId,
      messageType: m.messageTypeId,
      action: m.action,
      direction: m.direction,
      payload: JSON.stringify(m.payload),
      timestamp: m.receivedAt
    };
  }
}

module.exports = MessageService;