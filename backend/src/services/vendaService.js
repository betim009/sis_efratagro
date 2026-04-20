const vendaModel = require("../models/vendaModel");

const normalizeFilters = (queryParams = {}) => {
  const page = Math.max(Number(queryParams.page || 1), 1);
  const limit = Math.max(Number(queryParams.limit || 25), 1);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search: queryParams.search ? String(queryParams.search).trim() : null,
    tipoVenda: queryParams.tipo_venda ? String(queryParams.tipo_venda).trim() : null,
    status: queryParams.status ? String(queryParams.status).trim() : null
  };
};

const listVendas = async (queryParams) => {
  const filters = normalizeFilters(queryParams);
  const [items, total] = await Promise.all([
    vendaModel.listVendas(filters),
    vendaModel.countVendas(filters)
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

module.exports = {
  listVendas
};
