const { query } = require("../config/database");

// ═══════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Monta cláusula WHERE dinâmica a partir de um array de condições.
 * Retorna string vazia se não houver condições.
 */
const buildWhere = (conditions) =>
  conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE VENDAS
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioVendas = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`v.data_venda >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`v.data_venda <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.clienteId) {
    conditions.push(`v.cliente_id = $${idx}`);
    params.push(filters.clienteId);
    idx++;
  }

  if (filters.vendedorId) {
    conditions.push(`v.vendedor_id = $${idx}`);
    params.push(filters.vendedorId);
    idx++;
  }

  if (filters.status) {
    conditions.push(`v.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  if (filters.tipoVenda) {
    conditions.push(`v.tipo_venda = $${idx}`);
    params.push(filters.tipoVenda);
    idx++;
  }

  const where = buildWhere(conditions);

  // Query de totais
  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COALESCE(SUM(v.total_valor), 0) AS valor_total,
      COALESCE(SUM(v.desconto_valor), 0) AS total_descontos,
      COALESCE(SUM(v.frete_valor), 0) AS total_frete,
      COALESCE(AVG(v.total_valor), 0) AS ticket_medio
    FROM vendas v
    ${where}
  `;

  // Query dos registros com paginação
  const sqlRegistros = `
    SELECT
      v.id,
      v.numero,
      v.tipo_venda,
      v.status,
      v.forma_pagamento,
      v.data_venda,
      v.subtotal,
      v.desconto_valor,
      v.frete_valor,
      v.total_valor,
      c.nome_razao_social AS cliente_nome,
      c.cpf_cnpj AS cliente_cpf_cnpj,
      u.nome AS vendedor_nome
    FROM vendas v
    INNER JOIN clientes c ON c.id = v.cliente_id
    INNER JOIN usuarios u ON u.id = v.vendedor_id
    ${where}
    ORDER BY v.data_venda DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioEstoque = async (filters) => {
  const conditions = ["p.status = 'ATIVO'"];
  const params = [];
  let idx = 1;

  if (filters.localId) {
    conditions.push(`e.local_estoque_id = $${idx}`);
    params.push(filters.localId);
    idx++;
  }

  if (filters.produtoId) {
    conditions.push(`p.id = $${idx}`);
    params.push(filters.produtoId);
    idx++;
  }

  let havingClause = "";
  if (filters.apenasAbaixoMinimo) {
    havingClause = "HAVING COALESCE(SUM(e.quantidade), 0) < p.estoque_minimo";
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT COUNT(*) AS total_registros
    FROM (
      SELECT p.id
      FROM produtos p
      LEFT JOIN estoques e ON e.produto_id = p.id
      ${where}
      GROUP BY p.id
      ${havingClause}
    ) sub
  `;

  const sqlRegistros = `
    SELECT
      p.id,
      p.codigo,
      p.nome,
      p.unidade_medida,
      p.categoria,
      p.preco_custo,
      p.preco_venda,
      p.estoque_minimo,
      p.ponto_reposicao,
      COALESCE(SUM(e.quantidade), 0) AS saldo_total,
      COALESCE(SUM(e.reservado), 0) AS total_reservado,
      (COALESCE(SUM(e.quantidade), 0) - COALESCE(SUM(e.reservado), 0)) AS saldo_disponivel
    FROM produtos p
    LEFT JOIN estoques e ON e.produto_id = p.id
    ${where}
    GROUP BY p.id
    ${havingClause}
    ORDER BY p.nome
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE MOVIMENTAÇÕES DE ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioMovimentacoes = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`me.data_movimentacao >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`me.data_movimentacao <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.produtoId) {
    conditions.push(`me.produto_id = $${idx}`);
    params.push(filters.produtoId);
    idx++;
  }

  if (filters.localId) {
    conditions.push(`(me.local_origem_id = $${idx} OR me.local_destino_id = $${idx})`);
    params.push(filters.localId);
    idx++;
  }

  if (filters.responsavelId) {
    conditions.push(`me.usuario_id = $${idx}`);
    params.push(filters.responsavelId);
    idx++;
  }

  if (filters.tipoMovimentacao) {
    conditions.push(`me.tipo_movimentacao = $${idx}`);
    params.push(filters.tipoMovimentacao);
    idx++;
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COUNT(CASE WHEN me.tipo_movimentacao = 'ENTRADA' THEN 1 END) AS total_entradas,
      COUNT(CASE WHEN me.tipo_movimentacao = 'SAIDA' THEN 1 END) AS total_saidas,
      COUNT(CASE WHEN me.tipo_movimentacao = 'TRANSFERENCIA' THEN 1 END) AS total_transferencias,
      COUNT(CASE WHEN me.tipo_movimentacao = 'AJUSTE' THEN 1 END) AS total_ajustes,
      COALESCE(SUM(me.quantidade), 0) AS quantidade_total_movimentada
    FROM movimentacoes_estoque me
    ${where}
  `;

  const sqlRegistros = `
    SELECT
      me.id,
      me.tipo_movimentacao,
      me.quantidade,
      me.motivo,
      me.observacoes,
      me.data_movimentacao,
      p.codigo AS produto_codigo,
      p.nome AS produto_nome,
      lo.nome AS local_origem_nome,
      ld.nome AS local_destino_nome,
      u.nome AS responsavel_nome
    FROM movimentacoes_estoque me
    INNER JOIN produtos p ON p.id = me.produto_id
    LEFT JOIN locais_estoque lo ON lo.id = me.local_origem_id
    LEFT JOIN locais_estoque ld ON ld.id = me.local_destino_id
    INNER JOIN usuarios u ON u.id = me.usuario_id
    ${where}
    ORDER BY me.data_movimentacao DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE DUPLICATAS
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioDuplicatas = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`d.data_emissao >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`d.data_emissao <= $${idx}::date`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.clienteId) {
    conditions.push(`d.cliente_id = $${idx}`);
    params.push(filters.clienteId);
    idx++;
  }

  if (filters.status) {
    conditions.push(`d.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COALESCE(SUM(d.valor_total), 0) AS valor_total_emitido,
      COALESCE(SUM(d.valor_aberto), 0) AS valor_total_em_aberto,
      COALESCE(SUM(CASE WHEN d.status = 'PAGO' THEN d.valor_total ELSE 0 END), 0) AS valor_total_pago,
      COALESCE(SUM(CASE WHEN d.vencimento < CURRENT_DATE AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO') THEN d.valor_aberto ELSE 0 END), 0) AS valor_total_vencido,
      COUNT(CASE WHEN d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE') THEN 1 END) AS total_em_aberto,
      COUNT(CASE WHEN d.status = 'PAGO' THEN 1 END) AS total_pagas,
      COUNT(CASE WHEN d.vencimento < CURRENT_DATE AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO') THEN 1 END) AS total_vencidas
    FROM duplicatas d
    ${where}
  `;

  const sqlRegistros = `
    SELECT
      d.id,
      d.numero,
      d.parcela,
      d.valor_total,
      d.valor_aberto,
      d.vencimento,
      d.data_emissao,
      d.status,
      c.nome_razao_social AS cliente_nome,
      c.cpf_cnpj AS cliente_cpf_cnpj,
      v.numero AS venda_numero
    FROM duplicatas d
    INNER JOIN clientes c ON c.id = d.cliente_id
    INNER JOIN vendas v ON v.id = d.venda_id
    ${where}
    ORDER BY d.vencimento ASC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE PAGAMENTOS
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioPagamentos = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`pg.data_pagamento >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`pg.data_pagamento <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.formaPagamento) {
    conditions.push(`pg.forma_pagamento = $${idx}`);
    params.push(filters.formaPagamento);
    idx++;
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COALESCE(SUM(pg.valor), 0) AS valor_total_recebido,
      COUNT(DISTINCT pg.duplicata_id) AS total_duplicatas_pagas,
      COUNT(CASE WHEN pg.forma_pagamento = 'PIX' THEN 1 END) AS total_pix,
      COUNT(CASE WHEN pg.forma_pagamento = 'BOLETO' THEN 1 END) AS total_boleto,
      COUNT(CASE WHEN pg.forma_pagamento = 'CARTAO' THEN 1 END) AS total_cartao,
      COUNT(CASE WHEN pg.forma_pagamento = 'DINHEIRO' THEN 1 END) AS total_dinheiro,
      COUNT(CASE WHEN pg.forma_pagamento = 'TRANSFERENCIA' THEN 1 END) AS total_transferencia
    FROM pagamentos pg
    ${where}
  `;

  const sqlRegistros = `
    SELECT
      pg.id,
      pg.forma_pagamento,
      pg.valor,
      pg.data_pagamento,
      pg.referencia_externa,
      pg.observacoes,
      d.numero AS duplicata_numero,
      d.parcela AS duplicata_parcela,
      c.nome_razao_social AS cliente_nome,
      u.nome AS recebido_por
    FROM pagamentos pg
    INNER JOIN duplicatas d ON d.id = pg.duplicata_id
    INNER JOIN clientes c ON c.id = d.cliente_id
    LEFT JOIN usuarios u ON u.id = pg.recebido_por_usuario_id
    ${where}
    ORDER BY pg.data_pagamento DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE ENTREGAS
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioEntregas = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`en.criado_em >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`en.criado_em <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.status) {
    conditions.push(`en.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  if (filters.veiculoId) {
    conditions.push(`f.veiculo_id = $${idx}`);
    params.push(filters.veiculoId);
    idx++;
  }

  if (filters.vendedorId) {
    conditions.push(`v.vendedor_id = $${idx}`);
    params.push(filters.vendedorId);
    idx++;
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COUNT(CASE WHEN en.status = 'ENTREGUE' THEN 1 END) AS total_entregues,
      COUNT(CASE WHEN en.status = 'AGUARDANDO_DESPACHO' THEN 1 END) AS total_aguardando,
      COUNT(CASE WHEN en.status = 'EM_TRANSITO' THEN 1 END) AS total_em_transito,
      COUNT(CASE WHEN en.status = 'NAO_REALIZADA' THEN 1 END) AS total_nao_realizadas
    FROM entregas en
    INNER JOIN vendas v ON v.id = en.venda_id
    LEFT JOIN fretes f ON f.id = en.frete_id
    ${where}
  `;

  const sqlRegistros = `
    SELECT
      en.id,
      en.status,
      en.data_saida,
      en.data_entrega_realizada,
      en.tentativa_atual,
      en.observacoes,
      v.numero AS venda_numero,
      v.data_entrega_prevista,
      c.nome_razao_social AS cliente_nome,
      ve.placa AS veiculo_placa,
      ve.modelo AS veiculo_modelo,
      ur.nome AS responsavel_nome
    FROM entregas en
    INNER JOIN vendas v ON v.id = en.venda_id
    INNER JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN fretes f ON f.id = en.frete_id
    LEFT JOIN veiculos ve ON ve.id = f.veiculo_id
    LEFT JOIN usuarios ur ON ur.id = en.responsavel_usuario_id
    ${where}
    ORDER BY en.criado_em DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE FROTA / MANUTENÇÕES
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioFrota = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`m.data_manutencao >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`m.data_manutencao <= $${idx}::date`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.veiculoId) {
    conditions.push(`m.veiculo_id = $${idx}`);
    params.push(filters.veiculoId);
    idx++;
  }

  if (filters.status) {
    conditions.push(`m.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  if (filters.tipoManutencao) {
    conditions.push(`m.tipo_manutencao = $${idx}`);
    params.push(filters.tipoManutencao);
    idx++;
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COALESCE(SUM(m.custo), 0) AS custo_total,
      COUNT(CASE WHEN m.tipo_manutencao = 'PREVENTIVA' THEN 1 END) AS total_preventivas,
      COUNT(CASE WHEN m.tipo_manutencao = 'CORRETIVA' THEN 1 END) AS total_corretivas,
      COUNT(CASE WHEN m.status IN ('AGENDADA', 'EM_EXECUCAO') THEN 1 END) AS total_em_andamento
    FROM manutencoes m
    ${where}
  `;

  const sqlRegistros = `
    SELECT
      m.id,
      m.tipo_manutencao,
      m.descricao,
      m.data_manutencao,
      m.custo,
      m.status,
      m.quilometragem_registrada,
      v.placa AS veiculo_placa,
      v.modelo AS veiculo_modelo,
      v.marca AS veiculo_marca,
      fo.razao_social AS fornecedor_nome
    FROM manutencoes m
    INNER JOIN veiculos v ON v.id = m.veiculo_id
    LEFT JOIN fornecedores fo ON fo.id = m.fornecedor_id
    ${where}
    ORDER BY m.data_manutencao DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

// ═══════════════════════════════════════════════════════════════════════
// RELATÓRIO DE VENDAS FUTURAS
// ═══════════════════════════════════════════════════════════════════════

const getRelatorioVendasFuturas = async (filters) => {
  const conditions = ["v.tipo_venda = 'FUTURA'"];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`v.data_entrega_prevista >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`v.data_entrega_prevista <= $${idx}::date`);
    params.push(filters.dataFim);
    idx++;
  }

  if (filters.clienteId) {
    conditions.push(`v.cliente_id = $${idx}`);
    params.push(filters.clienteId);
    idx++;
  }

  if (filters.status) {
    conditions.push(`v.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  const where = buildWhere(conditions);

  const sqlTotais = `
    SELECT
      COUNT(*) AS total_registros,
      COALESCE(SUM(v.total_valor), 0) AS valor_total,
      COUNT(CASE WHEN v.status = 'PENDENTE' THEN 1 END) AS total_pendentes,
      COUNT(CASE WHEN v.status = 'CONFIRMADA' THEN 1 END) AS total_confirmados,
      COUNT(CASE WHEN v.status = 'CANCELADA' THEN 1 END) AS total_cancelados,
      COUNT(CASE WHEN v.status = 'FATURADA' THEN 1 END) AS total_faturados
    FROM vendas v
    ${where}
  `;

  const sqlRegistros = `
    SELECT
      v.id,
      v.numero,
      v.status,
      v.forma_pagamento,
      v.data_venda,
      v.data_entrega_prevista,
      v.total_valor,
      c.nome_razao_social AS cliente_nome,
      c.cpf_cnpj AS cliente_cpf_cnpj,
      u.nome AS vendedor_nome
    FROM vendas v
    INNER JOIN clientes c ON c.id = v.cliente_id
    INNER JOIN usuarios u ON u.id = v.vendedor_id
    ${where}
    ORDER BY v.data_entrega_prevista ASC NULLS LAST
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(filters.limit, filters.offset);

  const [totaisResult, registrosResult] = await Promise.all([
    query(sqlTotais, params.slice(0, -2)),
    query(sqlRegistros, params)
  ]);

  return {
    totais: totaisResult.rows[0],
    registros: registrosResult.rows
  };
};

module.exports = {
  getRelatorioVendas,
  getRelatorioEstoque,
  getRelatorioMovimentacoes,
  getRelatorioDuplicatas,
  getRelatorioPagamentos,
  getRelatorioEntregas,
  getRelatorioFrota,
  getRelatorioVendasFuturas
};
