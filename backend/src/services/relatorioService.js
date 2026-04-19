const relatorioModel = require("../models/relatorioModel");
const { gerarPdf } = require("../utils/exportPdf");
const { gerarExcel } = require("../utils/exportExcel");
const {
  parseVendasFilters,
  parseEstoqueFilters,
  parseMovimentacoesFilters,
  parseDuplicatasFilters,
  parsePagamentosFilters,
  parseEntregasFilters,
  parseFrotaFilters,
  parseVendasFuturasFilters
} = require("../utils/relatorioValidation");

// ═══════════════════════════════════════════════════════════════════════
// DEFINIÇÕES DE COLUNAS POR RELATÓRIO
// Reutilizadas tanto para PDF quanto para Excel.
// ═══════════════════════════════════════════════════════════════════════

const COLUNAS = {
  vendas: [
    { header: "Número", key: "numero", width: 70 },
    { header: "Cliente", key: "cliente_nome", width: 120 },
    { header: "Vendedor", key: "vendedor_nome", width: 90 },
    { header: "Tipo", key: "tipo_venda", width: 55 },
    { header: "Status", key: "status", width: 65 },
    { header: "Pagamento", key: "forma_pagamento", width: 65 },
    { header: "Data Venda", key: "data_venda", width: 75 },
    { header: "Subtotal", key: "subtotal", width: 65 },
    { header: "Desconto", key: "desconto_valor", width: 55 },
    { header: "Frete", key: "frete_valor", width: 55 },
    { header: "Total", key: "total_valor", width: 65 }
  ],
  estoque: [
    { header: "Código", key: "codigo", width: 60 },
    { header: "Produto", key: "nome", width: 140 },
    { header: "Unidade", key: "unidade_medida", width: 50 },
    { header: "Categoria", key: "categoria", width: 80 },
    { header: "Custo", key: "preco_custo", width: 60 },
    { header: "Venda", key: "preco_venda", width: 60 },
    { header: "Estq. Mínimo", key: "estoque_minimo", width: 60 },
    { header: "Saldo", key: "saldo_total", width: 60 },
    { header: "Reservado", key: "total_reservado", width: 55 },
    { header: "Disponível", key: "saldo_disponivel", width: 60 }
  ],
  movimentacoes: [
    { header: "Tipo", key: "tipo_movimentacao", width: 70 },
    { header: "Produto", key: "produto_nome", width: 120 },
    { header: "Código", key: "produto_codigo", width: 60 },
    { header: "Quantidade", key: "quantidade", width: 60 },
    { header: "Origem", key: "local_origem_nome", width: 80 },
    { header: "Destino", key: "local_destino_nome", width: 80 },
    { header: "Motivo", key: "motivo", width: 100 },
    { header: "Responsável", key: "responsavel_nome", width: 90 },
    { header: "Data", key: "data_movimentacao", width: 75 }
  ],
  duplicatas: [
    { header: "Número", key: "numero", width: 80 },
    { header: "Parcela", key: "parcela", width: 40 },
    { header: "Cliente", key: "cliente_nome", width: 120 },
    { header: "CPF/CNPJ", key: "cliente_cpf_cnpj", width: 80 },
    { header: "Venda", key: "venda_numero", width: 70 },
    { header: "Valor Total", key: "valor_total", width: 65 },
    { header: "Valor Aberto", key: "valor_aberto", width: 65 },
    { header: "Vencimento", key: "vencimento", width: 65 },
    { header: "Emissão", key: "data_emissao", width: 65 },
    { header: "Status", key: "status", width: 75 }
  ],
  pagamentos: [
    { header: "Duplicata", key: "duplicata_numero", width: 80 },
    { header: "Parcela", key: "duplicata_parcela", width: 40 },
    { header: "Cliente", key: "cliente_nome", width: 120 },
    { header: "Forma", key: "forma_pagamento", width: 70 },
    { header: "Valor", key: "valor", width: 65 },
    { header: "Data Pgto", key: "data_pagamento", width: 75 },
    { header: "Ref. Externa", key: "referencia_externa", width: 80 },
    { header: "Recebido Por", key: "recebido_por", width: 90 }
  ],
  entregas: [
    { header: "Venda", key: "venda_numero", width: 70 },
    { header: "Cliente", key: "cliente_nome", width: 120 },
    { header: "Status", key: "status", width: 90 },
    { header: "Veículo", key: "veiculo_placa", width: 60 },
    { header: "Modelo", key: "veiculo_modelo", width: 80 },
    { header: "Responsável", key: "responsavel_nome", width: 90 },
    { header: "Saída", key: "data_saida", width: 75 },
    { header: "Entrega Realiz.", key: "data_entrega_realizada", width: 75 },
    { header: "Prev. Entrega", key: "data_entrega_prevista", width: 75 },
    { header: "Tentativas", key: "tentativa_atual", width: 50 }
  ],
  frota: [
    { header: "Veículo", key: "veiculo_placa", width: 60 },
    { header: "Modelo", key: "veiculo_modelo", width: 80 },
    { header: "Marca", key: "veiculo_marca", width: 70 },
    { header: "Tipo", key: "tipo_manutencao", width: 65 },
    { header: "Descrição", key: "descricao", width: 130 },
    { header: "Data", key: "data_manutencao", width: 65 },
    { header: "Custo", key: "custo", width: 60 },
    { header: "Status", key: "status", width: 65 },
    { header: "Km", key: "quilometragem_registrada", width: 55 },
    { header: "Fornecedor", key: "fornecedor_nome", width: 100 }
  ],
  vendasFuturas: [
    { header: "Número", key: "numero", width: 70 },
    { header: "Cliente", key: "cliente_nome", width: 120 },
    { header: "CPF/CNPJ", key: "cliente_cpf_cnpj", width: 80 },
    { header: "Vendedor", key: "vendedor_nome", width: 90 },
    { header: "Status", key: "status", width: 65 },
    { header: "Pagamento", key: "forma_pagamento", width: 65 },
    { header: "Data Venda", key: "data_venda", width: 75 },
    { header: "Entrega Prev.", key: "data_entrega_prevista", width: 75 },
    { header: "Total", key: "total_valor", width: 65 }
  ]
};

// ═══════════════════════════════════════════════════════════════════════
// FORMATAÇÃO DE TOTAIS
// ═══════════════════════════════════════════════════════════════════════

const formatarTotais = (totais) => {
  const formatted = {};

  Object.entries(totais).forEach(([key, value]) => {
    formatted[key] = typeof value === "string" && !Number.isNaN(Number(value))
      ? Number(value)
      : value;
  });

  return formatted;
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE VENDAS
// ═══════════════════════════════════════════════════════════════════════

const getVendas = async (queryParams) => {
  const filters = parseVendasFilters(queryParams);
  const result = await relatorioModel.getRelatorioVendas(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

const exportarVendasPdf = async (queryParams) => {
  const filters = parseVendasFilters(queryParams);
  filters.limit = 5000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioVendas(filters);

  return gerarPdf({
    titulo: "Relatório de Vendas",
    colunas: COLUNAS.vendas,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      status: filters.status,
      tipoVenda: filters.tipoVenda
    }
  });
};

const exportarVendasExcel = async (queryParams) => {
  const filters = parseVendasFilters(queryParams);
  filters.limit = 50000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioVendas(filters);

  return gerarExcel({
    titulo: "Relatório de Vendas",
    colunas: COLUNAS.vendas,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      status: filters.status,
      tipoVenda: filters.tipoVenda
    }
  });
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getEstoque = async (queryParams) => {
  const filters = parseEstoqueFilters(queryParams);
  const result = await relatorioModel.getRelatorioEstoque(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

const exportarEstoquePdf = async (queryParams) => {
  const filters = parseEstoqueFilters(queryParams);
  filters.limit = 5000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioEstoque(filters);

  return gerarPdf({
    titulo: "Relatório de Estoque",
    colunas: COLUNAS.estoque,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: { localId: filters.localId, apenasAbaixoMinimo: filters.apenasAbaixoMinimo }
  });
};

const exportarEstoqueExcel = async (queryParams) => {
  const filters = parseEstoqueFilters(queryParams);
  filters.limit = 50000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioEstoque(filters);

  return gerarExcel({
    titulo: "Relatório de Estoque",
    colunas: COLUNAS.estoque,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: { localId: filters.localId, apenasAbaixoMinimo: filters.apenasAbaixoMinimo }
  });
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE MOVIMENTAÇÕES DE ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getMovimentacoes = async (queryParams) => {
  const filters = parseMovimentacoesFilters(queryParams);
  const result = await relatorioModel.getRelatorioMovimentacoes(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE DUPLICATAS
// ═══════════════════════════════════════════════════════════════════════

const getDuplicatas = async (queryParams) => {
  const filters = parseDuplicatasFilters(queryParams);
  const result = await relatorioModel.getRelatorioDuplicatas(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

const exportarDuplicatasPdf = async (queryParams) => {
  const filters = parseDuplicatasFilters(queryParams);
  filters.limit = 5000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioDuplicatas(filters);

  return gerarPdf({
    titulo: "Relatório de Duplicatas",
    colunas: COLUNAS.duplicatas,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      status: filters.status
    }
  });
};

const exportarDuplicatasExcel = async (queryParams) => {
  const filters = parseDuplicatasFilters(queryParams);
  filters.limit = 50000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioDuplicatas(filters);

  return gerarExcel({
    titulo: "Relatório de Duplicatas",
    colunas: COLUNAS.duplicatas,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      status: filters.status
    }
  });
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE PAGAMENTOS
// ═══════════════════════════════════════════════════════════════════════

const getPagamentos = async (queryParams) => {
  const filters = parsePagamentosFilters(queryParams);
  const result = await relatorioModel.getRelatorioPagamentos(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE ENTREGAS
// ═══════════════════════════════════════════════════════════════════════

const getEntregas = async (queryParams) => {
  const filters = parseEntregasFilters(queryParams);
  const result = await relatorioModel.getRelatorioEntregas(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

const exportarEntregasPdf = async (queryParams) => {
  const filters = parseEntregasFilters(queryParams);
  filters.limit = 5000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioEntregas(filters);

  return gerarPdf({
    titulo: "Relatório de Entregas",
    colunas: COLUNAS.entregas,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      status: filters.status
    }
  });
};

const exportarEntregasExcel = async (queryParams) => {
  const filters = parseEntregasFilters(queryParams);
  filters.limit = 50000;
  filters.offset = 0;

  const result = await relatorioModel.getRelatorioEntregas(filters);

  return gerarExcel({
    titulo: "Relatório de Entregas",
    colunas: COLUNAS.entregas,
    registros: result.registros,
    totais: formatarTotais(result.totais),
    filtrosAplicados: {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      status: filters.status
    }
  });
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE FROTA / MANUTENÇÕES
// ═══════════════════════════════════════════════════════════════════════

const getFrota = async (queryParams) => {
  const filters = parseFrotaFilters(queryParams);
  const result = await relatorioModel.getRelatorioFrota(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE VENDAS FUTURAS
// ═══════════════════════════════════════════════════════════════════════

const getVendasFuturas = async (queryParams) => {
  const filters = parseVendasFuturasFilters(queryParams);
  const result = await relatorioModel.getRelatorioVendasFuturas(filters);

  return {
    totais: formatarTotais(result.totais),
    registros: result.registros,
    paginacao: { page: filters.page, limit: filters.limit },
    filtros_aplicados: filters
  };
};

module.exports = {
  getVendas,
  exportarVendasPdf,
  exportarVendasExcel,
  getEstoque,
  exportarEstoquePdf,
  exportarEstoqueExcel,
  getMovimentacoes,
  getDuplicatas,
  exportarDuplicatasPdf,
  exportarDuplicatasExcel,
  getPagamentos,
  getEntregas,
  exportarEntregasPdf,
  exportarEntregasExcel,
  getFrota,
  getVendasFuturas
};
