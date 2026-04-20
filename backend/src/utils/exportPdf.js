/**
 * Utilitário de exportação PDF usando PDFKit.
 *
 * Estratégia: recebe título, colunas e rows genéricos.
 * Gera PDF em memória e retorna como Buffer, evitando escrita em disco.
 * Cada relatório define suas colunas — o exportador é genérico.
 */
const PDFDocument = require("pdfkit");

const MARGIN = 40;
const FONT_SIZE_TITLE = 16;
const FONT_SIZE_HEADER = 8;
const FONT_SIZE_ROW = 7;
const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 20;

/**
 * Gera um PDF tabulado a partir de dados genéricos.
 *
 * @param {Object} options
 * @param {string} options.titulo - Título do relatório
 * @param {Array<{header: string, key: string, width: number}>} options.colunas
 * @param {Array<Object>} options.registros - Dados das linhas
 * @param {Object} [options.totais] - Objeto com totais para rodapé
 * @param {Object} [options.filtrosAplicados] - Filtros usados para subtítulo
 * @returns {Promise<Buffer>}
 */
const gerarPdf = (options) => {
  const { titulo, colunas, registros, totais, filtrosAplicados } = options;

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ─── Título ───────────────────────────────────────────────
    doc
      .fontSize(FONT_SIZE_TITLE)
      .font("Helvetica-Bold")
      .text(titulo, { align: "center" });

    doc.moveDown(0.3);

    // ─── Subtítulo com filtros ────────────────────────────────
    if (filtrosAplicados) {
      const partes = Object.entries(filtrosAplicados)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}: ${v}`);

      if (partes.length) {
        doc
          .fontSize(8)
          .font("Helvetica")
          .text(`Filtros: ${partes.join(" | ")}`, { align: "center" });
        doc.moveDown(0.3);
      }
    }

    doc
      .fontSize(7)
      .font("Helvetica")
      .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, { align: "right" });

    doc.moveDown(0.5);

    // ─── Totais (resumo) ─────────────────────────────────────
    if (totais) {
      const totaisTexto = Object.entries(totais)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join("   |   ");

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(totaisTexto, MARGIN, doc.y, { width: doc.page.width - MARGIN * 2 });

      doc.moveDown(0.5);
    }

    // ─── Cabeçalho da tabela ─────────────────────────────────
    let startY = doc.y;
    let x = MARGIN;

    doc.fontSize(FONT_SIZE_HEADER).font("Helvetica-Bold");

    colunas.forEach((col) => {
      doc.text(col.header, x, startY, {
        width: col.width,
        ellipsis: true
      });
      x += col.width;
    });

    startY += HEADER_HEIGHT;

    // Linha separadora
    doc
      .moveTo(MARGIN, startY - 4)
      .lineTo(doc.page.width - MARGIN, startY - 4)
      .stroke();

    // ─── Linhas de dados ─────────────────────────────────────
    doc.fontSize(FONT_SIZE_ROW).font("Helvetica");

    registros.forEach((registro) => {
      // Nova página se necessário
      if (startY + ROW_HEIGHT > doc.page.height - MARGIN) {
        doc.addPage();
        startY = MARGIN;
      }

      x = MARGIN;

      colunas.forEach((col) => {
        const valor = registro[col.key] !== null && registro[col.key] !== undefined
          ? String(registro[col.key])
          : "";

        doc.text(valor, x, startY, {
          width: col.width,
          ellipsis: true
        });

        x += col.width;
      });

      startY += ROW_HEIGHT;
    });

    // ─── Rodapé ──────────────────────────────────────────────
    doc
      .fontSize(7)
      .font("Helvetica")
      .text(
        `Total de registros: ${registros.length}`,
        MARGIN,
        doc.page.height - MARGIN,
        { align: "center", width: doc.page.width - MARGIN * 2 }
      );

    doc.end();
  });
};

module.exports = { gerarPdf };
