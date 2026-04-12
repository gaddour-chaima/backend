const moment = require('moment');

const parseDateRange = (startDate, endDate) => {
  const start = startDate ? moment(startDate).startOf('day').toDate() : null;
  const end = endDate ? moment(endDate).endOf('day').toDate() : null;
  return { start, end };
};

const isValidDate = (dateString) => {
  return moment(dateString).isValid();
};

module.exports = {
  parseDateRange,
  isValidDate
};