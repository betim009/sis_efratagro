const relatorioService = require("../services/relatorioService");

// ═══════════════════════════════════════════════════════════════════════
// HELPER — Resposta padrão de relatório
// ═══════════════════════════════════════════════════════════════════════

const sendRelatorio = (response, data) =>
  response.status(200).json({ status: "success", data });

// ═══════════════════════════════════════════════════════════════════════
// HELPER — Resposta de exportação binária
// ═══════════════════════════════════════════════════════════════════════

const sendExport = (response, buffer, filename, contentType) => {
  response.setHeader("Content-Type", contentType);
  response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  response.setHeader("Content-Length", buffer.length);
  return response.end(buffer);
};

// ═══════════════════════════════════════════════════════════════════════
// VENDAS
// ═══════════════════════════════════════════════════════════════════════

const getVendas = async (request, response, next) => {
  try {
    const data = await relatorioService.getVendas(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

const exportarVendasPdf = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarVendasPdf(request.query);
    return sendExport(response, buffer, "relatorio-vendas.pdf", "application/pdf");
  } catch (error) {
    return next(error);
  }
};

const exportarVendasExcel = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarVendasExcel(request.query);
    return sendExport(
      response,
      buffer,
      "relatorio-vendas.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getEstoque = async (request, response, next) => {
  try {
    const data = await relatorioService.getEstoque(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

const exportarEstoquePdf = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarEstoquePdf(request.query);
    return sendExport(response, buffer, "relatorio-estoque.pdf", "application/pdf");
  } catch (error) {
    return next(error);
  }
};

const exportarEstoqueExcel = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarEstoqueExcel(request.query);
    return sendExport(
      response,
      buffer,
      "relatorio-estoque.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// MOVIMENTAÇÕES DE ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getMovimentacoes = async (request, response, next) => {
  try {
    const data = await relatorioService.getMovimentacoes(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// DUPLICATAS
// ═══════════════════════════════════════════════════════════════════════

const getDuplicatas = async (request, response, next) => {
  try {
    const data = await relatorioService.getDuplicatas(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

const exportarDuplicatasPdf = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarDuplicatasPdf(request.query);
    return sendExport(response, buffer, "relatorio-duplicatas.pdf", "application/pdf");
  } catch (error) {
    return next(error);
  }
};

const exportarDuplicatasExcel = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarDuplicatasExcel(request.query);
    return sendExport(
      response,
      buffer,
      "relatorio-duplicatas.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// PAGAMENTOS
// ═══════════════════════════════════════════════════════════════════════

const getPagamentos = async (request, response, next) => {
  try {
    const data = await relatorioService.getPagamentos(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// ENTREGAS
// ═══════════════════════════════════════════════════════════════════════

const getEntregas = async (request, response, next) => {
  try {
    const data = await relatorioService.getEntregas(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

const exportarEntregasPdf = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarEntregasPdf(request.query);
    return sendExport(response, buffer, "relatorio-entregas.pdf", "application/pdf");
  } catch (error) {
    return next(error);
  }
};

const exportarEntregasExcel = async (request, response, next) => {
  try {
    const buffer = await relatorioService.exportarEntregasExcel(request.query);
    return sendExport(
      response,
      buffer,
      "relatorio-entregas.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// FROTA
// ═══════════════════════════════════════════════════════════════════════

const getFrota = async (request, response, next) => {
  try {
    const data = await relatorioService.getFrota(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// VENDAS FUTURAS
// ═══════════════════════════════════════════════════════════════════════

const getVendasFuturas = async (request, response, next) => {
  try {
    const data = await relatorioService.getVendasFuturas(request.query);
    return sendRelatorio(response, data);
  } catch (error) {
    return next(error);
  }
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
