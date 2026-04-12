const getPagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    skip: offset,
    limit: parseInt(limit)
  };
};

const getSorting = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  return sort;
};

const getMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages
  };
};

module.exports = {
  getPagination,
  getSorting,
  getMeta
};