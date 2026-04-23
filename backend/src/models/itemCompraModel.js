const { query } = require("../config/database");

const resolveExecutor = (executor) => executor || { query };

const createItemCompra = async (payload, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO itens_compra (
        compra_id,
        produto_id,
        local_destino_id,
        movimentacao_estoque_id,
        sequencia,
        quantidade,
        custo_unitario,
        total_valor
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        public_id,
        compra_id,
        produto_id,
        local_destino_id,
        movimentacao_estoque_id,
        sequencia,
        quantidade,
        custo_unitario,
        total_valor,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.compraId,
      payload.produtoId,
      payload.localDestinoId,
      payload.movimentacaoEstoqueId || null,
      payload.sequencia,
      payload.quantidade,
      payload.custoUnitario,
      payload.totalValor
    ]
  );

  return result.rows[0];
};

const listItensByCompraId = async (compraId) => {
  const result = await query(
    `
      SELECT
        ic.id,
        ic.public_id,
        ic.compra_id,
        ic.produto_id,
        p.public_id AS produto_public_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        ic.local_destino_id,
        l.public_id AS local_destino_public_id,
        l.codigo AS local_destino_codigo,
        l.nome AS local_destino_nome,
        ic.movimentacao_estoque_id,
        me.public_id AS movimentacao_estoque_public_id,
        ic.sequencia,
        ic.quantidade,
        ic.custo_unitario,
        ic.total_valor,
        ic.criado_em AS created_at,
        ic.atualizado_em AS updated_at
      FROM itens_compra ic
      INNER JOIN produtos p ON p.id = ic.produto_id
      INNER JOIN locais_estoque l ON l.id = ic.local_destino_id
      LEFT JOIN movimentacoes_estoque me ON me.id = ic.movimentacao_estoque_id
      WHERE ic.compra_id = $1
      ORDER BY ic.sequencia ASC
    `,
    [compraId]
  );

  return result.rows;
};

module.exports = {
  createItemCompra,
  listItensByCompraId
};
