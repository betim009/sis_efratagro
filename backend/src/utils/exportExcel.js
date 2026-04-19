/**
 * Utilitário de exportação Excel usando ExcelJS.
 *
 * Estratégia: recebe título, colunas e rows genéricos.
 * Gera XLSX em memória e retorna como Buffer.
 * Aplica formatação básica: cabeçalho em negrito, auto-filtro, largura automática.
 */
const ExcelJS = require("exceljs");

/**
 * Gera um Excel (.xlsx) a partir de dados genéricos.
 *
 * @param {Object} options
 * @param {string} options.titulo - Nome da aba e título
 * @param {Array<{header: string, key: string, width: number}>} options.colunas
 * @param {Array<Object>} options.registros - Dados das linhas
 * @param {Object} [options.totais] - Objeto com totais para linha de resumo
 * @param {Object} [options.filtrosAplicados] - Filtros usados (adicionados como info)
 * @returns {Promise<Buffer>}
 */
const gerarExcel = async (options) => {
  const { titulo, colunas, registros, totais, filtrosAplicados } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIS EfratAgro";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(titulo.substring(0, 31));

  // ─── Título ─────────────────────────────────────────────────
  const tituloRow = sheet.addRow([titulo]);
  tituloRow.font = { bold: true, size: 14 };
  sheet.mergeCells(1, 1, 1, colunas.length);

  // ─── Filtros aplicados ──────────────────────────────────────
  if (filtrosAplicados) {
    const partes = Object.entries(filtrosAplicados)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    if (partes) {
      const filtroRow = sheet.addRow([`Filtros: ${partes}`]);
      filtroRow.font = { italic: true, size: 9, color: { argb: "FF666666" } };
      sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, colunas.length);
    }
  }

  const dataRow = sheet.addRow([`Gerado em: ${new Date().toLocaleString("pt-BR")}`]);
  dataRow.font = { size: 8, color: { argb: "FF999999" } };
  sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, colunas.length);

  // ─── Totais (resumo) ───────────────────────────────────────
  if (totais) {
    sheet.addRow([]);
    const totaisEntries = Object.entries(totais);

    for (let i = 0; i < totaisEntries.length; i += 2) {
      const parts = [];
      parts.push(`${totaisEntries[i][0].replace(/_/g, " ")}: ${totaisEntries[i][1]}`);
      if (totaisEntries[i + 1]) {
        parts.push(`${totaisEntries[i + 1][0].replace(/_/g, " ")}: ${totaisEntries[i + 1][1]}`);
      }
      const row = sheet.addRow(parts);
      row.font = { bold: true, size: 9 };
    }
  }

  sheet.addRow([]);

  // ─── Cabeçalho ─────────────────────────────────────────────
  const headerValues = colunas.map((c) => c.header);
  const headerRow = sheet.addRow(headerValues);
  const headerRowNumber = sheet.rowCount;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E7D32" }
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF000000" } }
    };
  });

  // ─── Largura das colunas ───────────────────────────────────
  colunas.forEach((col, i) => {
    sheet.getColumn(i + 1).width = Math.max(col.width / 5, col.header.length + 4);
  });

  // ─── Dados ─────────────────────────────────────────────────
  registros.forEach((registro) => {
    const values = colunas.map((col) => {
      const val = registro[col.key];
      return val !== null && val !== undefined ? val : "";
    });
    sheet.addRow(values);
  });

  // ─── Auto-filtro ───────────────────────────────────────────
  if (registros.length > 0) {
    sheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber + registros.length, column: colunas.length }
    };
  }

  // ─── Gerar buffer ──────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

module.exports = { gerarExcel };
