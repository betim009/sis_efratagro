const estoqueModel = require("../models/estoqueModel");

const normalizeFilters = (queryParams = {}) => {
  const page = Math.max(Number(queryParams.page || 1), 1);
  const limit = Math.max(Number(queryParams.limit || 25), 1);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search: queryParams.search ? String(queryParams.search).trim() : null
  };
};

const listarSaldos = async (queryParams) => {
  const filters = normalizeFilters(queryParams);
  const [items, total] = await Promise.all([
    estoqueModel.listSaldos(filters),
    estoqueModel.countSaldos(filters)
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

const listarMovimentacoes = async (queryParams) => {
  const filters = normalizeFilters(queryParams);
  const [items, total] = await Promise.all([
    estoqueModel.listMovimentacoes(filters),
    estoqueModel.countMovimentacoes(filters)
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

const listarAlertasBaixoEstoque = async () => estoqueModel.listAlertasBaixoEstoque();

module.exports = {
  listarSaldos,
  listarMovimentacoes,
  listarAlertasBaixoEstoque
};
