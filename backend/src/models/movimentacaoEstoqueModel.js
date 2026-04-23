const { query } = require("../config/database");

const resolveExecutor = (executor) => executor || { query };

const createMovimentacao = async (payload, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO movimentacoes_estoque (
        produto_id,
        fornecedor_id,
        local_origem_id,
        local_destino_id,
        usuario_id,
        cliente_id,
        venda_id,
        tipo_movimentacao,
        quantidade,
        custo_unitario,
        valor_total,
        motivo,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING
        id,
        public_id,
        produto_id,
        fornecedor_id,
        local_origem_id,
        local_destino_id,
        usuario_id,
        cliente_id,
        venda_id,
        tipo_movimentacao,
        quantidade,
        custo_unitario,
        valor_total,
        motivo,
        observacoes,
        data_movimentacao,
        criado_em
    `,
    [
      payload.produtoId,
      payload.fornecedorId || null,
      payload.localOrigemId,
      payload.localDestinoId,
      payload.usuarioId,
      payload.clienteId || null,
      payload.vendaId,
      payload.tipoMovimentacao,
      payload.quantidade,
      payload.custoUnitario ?? null,
      payload.valorTotal ?? null,
      payload.motivo,
      payload.observacoes
    ]
  );

  return result.rows[0];
};

module.exports = {
  createMovimentacao
};
