const { query } = require("../config/database");

const resolveExecutor = (executor) => executor || { query };

const createContaPagar = async (payload, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO contas_pagar (
        compra_id,
        fornecedor_id,
        numero,
        parcela,
        valor_total,
        valor_aberto,
        vencimento,
        data_emissao,
        status,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'EM_ABERTO', $8)
      RETURNING
        id,
        public_id,
        compra_id,
        fornecedor_id,
        numero,
        parcela,
        valor_total,
        valor_aberto,
        vencimento,
        data_emissao,
        status,
        observacoes,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.compraId,
      payload.fornecedorId,
      payload.numero,
      payload.parcela || 1,
      payload.valorTotal,
      payload.valorTotal,
      payload.vencimento,
      payload.observacoes
    ]
  );

  return result.rows[0];
};

module.exports = {
  createContaPagar
};
