const dashboardModel = require("../models/dashboardModel");
const {
  parsePeriodoFilters,
  parseSerieTemporalFilters,
  parseAlertasFilters,
  parseFinanceiroFilters,
  parseEstoqueFilters
} = require("../utils/dashboardValidation");

// ═══════════════════════════════════════════════════════════════════════
// RESUMO GERAL
// ═══════════════════════════════════════════════════════════════════════

/**
 * Consolida dados de vendas (dia/semana/mês) + contadores gerais em uma
 * única resposta. Executa duas queries em paralelo para reduzir latência.
 */
const getResumo = async () => {
  const [resumoVendas, contadores] = await Promise.all([
    dashboardModel.getResumoVendas(),
    dashboardModel.getContadoresGerais()
  ]);

  return {
    vendas: {
      total_dia: Number(resumoVendas.total_vendas_dia),
      total_semana: Number(resumoVendas.total_vendas_semana),
      total_mes: Number(resumoVendas.total_vendas_mes),
      quantidade_dia: Number(resumoVendas.quantidade_vendas_dia),
      quantidade_semana: Number(resumoVendas.quantidade_vendas_semana),
      quantidade_mes: Number(resumoVendas.quantidade_vendas_mes)
    },
    contadores: {
      clientes_ativos: Number(contadores.clientes_ativos),
      produtos_ativos: Number(contadores.produtos_ativos),
      entregas_pendentes: Number(contadores.entregas_pendentes),
      veiculos_em_manutencao: Number(contadores.veiculos_em_manutencao)
    }
  };
};

// ═══════════════════════════════════════════════════════════════════════
// VENDAS
// ═══════════════════════════════════════════════════════════════════════

const getVendas = async (queryParams) => {
  const filters = parsePeriodoFilters(queryParams);

  const [metricas, topVendedores] = await Promise.all([
    dashboardModel.getMetricasVendas(filters),
    dashboardModel.getTopVendedores(filters, 5)
  ]);

  return {
    metricas: {
      total_pedidos: Number(metricas.total_pedidos),
      valor_total: Number(metricas.valor_total),
      ticket_medio: Number(Number(metricas.ticket_medio).toFixed(2)),
      total_descontos: Number(metricas.total_descontos),
      total_frete: Number(metricas.total_frete),
      por_tipo: {
        normais: Number(metricas.vendas_normais),
        futuras: Number(metricas.vendas_futuras),
        diretas: Number(metricas.vendas_diretas)
      },
      por_status: {
        pendentes: Number(metricas.vendas_pendentes),
        confirmadas: Number(metricas.vendas_confirmadas),
        faturadas: Number(metricas.vendas_faturadas)
      }
    },
    top_vendedores: topVendedores.map((v) => ({
      vendedor_id: v.vendedor_id,
      vendedor_nome: v.vendedor_nome,
      total_pedidos: Number(v.total_pedidos),
      valor_total: Number(v.valor_total)
    })),
    filtros_aplicados: filters
  };
};

// ═══════════════════════════════════════════════════════════════════════
// FINANCEIRO
// ═══════════════════════════════════════════════════════════════════════

const getFinanceiro = async (queryParams) => {
  const filters = parseFinanceiroFilters(queryParams);

  const metricas = await dashboardModel.getMetricasFinanceiro(filters);

  return {
    metricas: {
      total_em_aberto: Number(metricas.total_em_aberto),
      valor_total_em_aberto: Number(metricas.valor_total_em_aberto),
      total_vencidas: Number(metricas.total_vencidas),
      valor_total_vencido: Number(metricas.valor_total_vencido),
      vencendo_em_x_dias: Number(metricas.vencendo_em_x_dias)
    },
    filtros_aplicados: { dias: filters.dias }
  };
};

// ═══════════════════════════════════════════════════════════════════════
// ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

const getEstoque = async (queryParams) => {
  const filters = parseEstoqueFilters(queryParams);

  const [metricas, topReposicao, saldoPorLocal] = await Promise.all([
    dashboardModel.getMetricasEstoque(filters),
    dashboardModel.getTopReposicao(filters, filters.limit),
    dashboardModel.getSaldoPorLocal(filters)
  ]);

  return {
    metricas: {
      total_produtos_abaixo_minimo: Number(metricas.total_produtos_abaixo_minimo)
    },
    top_reposicao: topReposicao.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      unidade_medida: p.unidade_medida,
      estoque_minimo: Number(p.estoque_minimo),
      ponto_reposicao: Number(p.ponto_reposicao),
      saldo_atual: Number(p.saldo_atual),
      reservado: Number(p.reservado),
      deficit: Number(p.deficit)
    })),
    saldo_por_local: saldoPorLocal.map((l) => ({
      local_id: l.local_id,
      local_nome: l.local_nome,
      local_codigo: l.local_codigo,
      tipo_local: l.tipo_local,
      total_produtos: Number(l.total_produtos),
      saldo_total: Number(l.saldo_total),
      total_reservado: Number(l.total_reservado)
    })),
    filtros_aplicados: {
      localId: filters.localId || null,
      limit: filters.limit
    }
  };
};

// ═══════════════════════════════════════════════════════════════════════
// VENDAS FUTURAS
// ═══════════════════════════════════════════════════════════════════════

const getVendasFuturas = async (queryParams) => {
  const filters = parseAlertasFilters(queryParams);

  const metricas = await dashboardModel.getMetricasVendasFuturas(filters);

  return {
    metricas: {
      total_pedidos_futuros: Number(metricas.total_pedidos_futuros),
      valor_total_previsto: Number(metricas.valor_total_previsto),
      pendentes: Number(metricas.pendentes),
      confirmados: Number(metricas.confirmados),
      prazo_proximo: Number(metricas.prazo_proximo)
    },
    filtros_aplicados: { dias: filters.dias }
  };
};

// ═══════════════════════════════════════════════════════════════════════
// FROTA
// ═══════════════════════════════════════════════════════════════════════

const getFrota = async (queryParams) => {
  const filters = parsePeriodoFilters(queryParams);

  const metricas = await dashboardModel.getMetricasFrota(filters);

  return {
    metricas: {
      veiculos_em_manutencao: Number(metricas.veiculos_em_manutencao),
      veiculos_ativos: Number(metricas.veiculos_ativos),
      veiculos_inativos: Number(metricas.veiculos_inativos),
      total_veiculos: Number(metricas.total_veiculos),
      total_gasto_manutencao: Number(metricas.total_gasto_manutencao),
      total_preventivas: Number(metricas.total_preventivas),
      total_corretivas: Number(metricas.total_corretivas),
      manutencoes_ativas: Number(metricas.manutencoes_ativas)
    },
    filtros_aplicados: filters
  };
};

// ═══════════════════════════════════════════════════════════════════════
// SÉRIE TEMPORAL
// ═══════════════════════════════════════════════════════════════════════

const getSeriesVendas = async (queryParams) => {
  const filters = parseSerieTemporalFilters(queryParams);

  const series = await dashboardModel.getSerieTemporalVendas(filters);

  return {
    series: series.map((s) => ({
      periodo: s.periodo,
      quantidade_pedidos: Number(s.quantidade_pedidos),
      valor_total: Number(s.valor_total)
    })),
    filtros_aplicados: filters
  };
};

// ═══════════════════════════════════════════════════════════════════════
// ALERTAS CONSOLIDADOS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Consolida todos os alertas em uma única resposta.
 * Executa 5 queries em paralelo para minimizar tempo de resposta.
 */
const getAlertas = async (queryParams) => {
  const filters = parseAlertasFilters(queryParams);

  const [
    estoqueBaixo,
    duplicatasVencidas,
    vendasFuturasProximas,
    manutencaoPreventiva,
    entregasPendentes
  ] = await Promise.all([
    dashboardModel.getAlertasEstoqueBaixo(10),
    dashboardModel.getAlertasDuplicatasVencidas(10),
    dashboardModel.getAlertasVendasFuturasProximas(filters.dias, 10),
    dashboardModel.getAlertasManutencaoPreventiva(10),
    dashboardModel.getAlertasEntregasPendentes(10)
  ]);

  return {
    estoque_baixo: {
      total: estoqueBaixo.length,
      itens: estoqueBaixo.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        nome: i.nome,
        estoque_minimo: Number(i.estoque_minimo),
        saldo_atual: Number(i.saldo_atual)
      }))
    },
    duplicatas_vencidas: {
      total: duplicatasVencidas.length,
      itens: duplicatasVencidas.map((d) => ({
        id: d.id,
        numero: d.numero,
        parcela: d.parcela,
        valor_total: Number(d.valor_total),
        valor_aberto: Number(d.valor_aberto),
        vencimento: d.vencimento,
        status: d.status,
        cliente_nome: d.cliente_nome
      }))
    },
    vendas_futuras_proximas: {
      total: vendasFuturasProximas.length,
      itens: vendasFuturasProximas.map((v) => ({
        id: v.id,
        numero: v.numero,
        total_valor: Number(v.total_valor),
        data_entrega_prevista: v.data_entrega_prevista,
        status: v.status,
        cliente_nome: v.cliente_nome
      }))
    },
    manutencao_preventiva: {
      total: manutencaoPreventiva.length,
      itens: manutencaoPreventiva.map((m) => ({
        id: m.id,
        descricao: m.descricao,
        proxima_manutencao_data: m.proxima_manutencao_data,
        proxima_manutencao_km: m.proxima_manutencao_km
          ? Number(m.proxima_manutencao_km)
          : null,
        veiculo_id: m.veiculo_id,
        placa: m.placa,
        modelo: m.modelo,
        quilometragem_atual: Number(m.quilometragem_atual)
      }))
    },
    entregas_pendentes: {
      total: entregasPendentes.length,
      itens: entregasPendentes.map((e) => ({
        id: e.id,
        status: e.status,
        data_saida: e.data_saida,
        tentativa_atual: e.tentativa_atual,
        venda_numero: e.venda_numero,
        data_entrega_prevista: e.data_entrega_prevista,
        cliente_nome: e.cliente_nome
      }))
    }
  };
};

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD COMPLETO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Endpoint "tudo em um" para montar o dashboard completo no frontend
 * com uma única chamada HTTP. Executa todos os blocos em paralelo.
 */
const getCompleto = async (queryParams) => {
  const [resumo, vendas, financeiro, estoque, vendasFuturas, frota, alertas] =
    await Promise.all([
      getResumo(),
      getVendas(queryParams),
      getFinanceiro(queryParams),
      getEstoque(queryParams),
      getVendasFuturas(queryParams),
      getFrota(queryParams),
      getAlertas(queryParams)
    ]);

  return {
    resumo,
    vendas,
    financeiro,
    estoque,
    vendas_futuras: vendasFuturas,
    frota,
    alertas
  };
};

module.exports = {
  getResumo,
  getVendas,
  getFinanceiro,
  getEstoque,
  getVendasFuturas,
  getFrota,
  getSeriesVendas,
  getAlertas,
  getCompleto
};
