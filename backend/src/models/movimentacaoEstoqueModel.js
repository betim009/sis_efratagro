const { query } = require("../config/database");

const resolveExecutor = (executor) => executor || { query };

const createMovimentacao = async (payload, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO movimentacoes_estoque (
        produto_id,
        local_origem_id,
        local_destino_id,
        usuario_id,
        venda_id,
        tipo_movimentacao,
        quantidade,
        motivo,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        produto_id,
        local_origem_id,
        local_destino_id,
        usuario_id,
        venda_id,
        tipo_movimentacao,
        quantidade,
        motivo,
        observacoes,
        data_movimentacao,
        criado_em
    `,
    [
      payload.produtoId,
      payload.localOrigemId,
      payload.localDestinoId,
      payload.usuarioId,
      payload.vendaId,
      payload.tipoMovimentacao,
      payload.quantidade,
      payload.motivo,
      payload.observacoes
    ]
  );

  return result.rows[0];
};

module.exports = {
  createMovimentacao
};
