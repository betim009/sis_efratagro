/**
 * Helper reutilizável para disparo de notificações internas.
 *
 * Estratégia: os services de negócio chamam este helper após eventos relevantes.
 * O helper centraliza a criação da notificação, evitando que cada módulo
 * repita a lógica de montar payload + chamar o model.
 *
 * Decisão sobre fire-and-forget: a notificação nunca deve quebrar o fluxo
 * principal. Todas as funções deste helper capturam erros silenciosamente,
 * logando no console para diagnóstico.
 *
 * Decisão sobre e-mail: cada função verifica se o emailProvider está ativo
 * e chama o envio de forma assíncrona e não-bloqueante. Hoje o provider
 * é um stub que apenas loga — quando o SMTP for configurado, nenhum código
 * de negócio precisará mudar.
 */

const notificacaoService = require("../services/notificacaoService");
const emailProvider = require("./emailProvider");

// ─── Notificação individual ─────────────────────────────────────────

const notificar = async ({
  usuarioId,
  tipo,
  titulo,
  mensagem,
  prioridade = "MEDIA",
  entidade = null,
  entidadeId = null,
  metadata = null
}) => {
  try {
    const notificacao = await notificacaoService.criarNotificacao({
      usuarioId,
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade,
      entidadeId,
      metadata
    });

    // Disparo assíncrono de e-mail (fire-and-forget, não bloqueia)
    emailProvider
      .enviarSeAtivo({ usuarioId, tipo, titulo, mensagem, prioridade })
      .catch((err) =>
        console.error("[notificacao] Falha no envio de email:", err.message)
      );

    return notificacao;
  } catch (error) {
    console.error("[notificacao] Falha ao criar notificacao:", error.message);
    return null;
  }
};

// ─── Notificação para múltiplos usuários ────────────────────────────

const notificarMultiplos = async (usuarioIds, notificacaoBase) => {
  try {
    return await notificacaoService.criarParaMultiplosUsuarios(
      usuarioIds,
      notificacaoBase
    );
  } catch (error) {
    console.error(
      "[notificacao] Falha ao notificar multiplos usuarios:",
      error.message
    );
    return [];
  }
};

// ─── Atalhos por tipo de evento ─────────────────────────────────────

const notificarEstoqueBaixo = async ({
  usuarioIds,
  produto,
  quantidadeAtual,
  quantidadeMinima
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "ESTOQUE_BAIXO",
    titulo: `Estoque baixo: ${produto.nome}`,
    mensagem: `O produto "${produto.nome}" está com ${quantidadeAtual} unidades, abaixo do mínimo de ${quantidadeMinima}.`,
    prioridade: "ALTA",
    entidade: "produtos",
    entidadeId: produto.id,
    metadata: { quantidadeAtual, quantidadeMinima, sku: produto.sku || null }
  });

const notificarDuplicataVencida = async ({
  usuarioIds,
  duplicata
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "DUPLICATA_VENCIDA",
    titulo: `Duplicata vencida #${duplicata.numero || duplicata.id}`,
    mensagem: `A duplicata de R$${duplicata.valor} venceu em ${duplicata.data_vencimento}.`,
    prioridade: "CRITICA",
    entidade: "duplicatas",
    entidadeId: duplicata.id,
    metadata: { valor: duplicata.valor, data_vencimento: duplicata.data_vencimento }
  });

const notificarDuplicataVencendo = async ({
  usuarioIds,
  duplicata,
  diasParaVencer
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "DUPLICATA_VENCENDO",
    titulo: `Duplicata vencendo em ${diasParaVencer} dia(s)`,
    mensagem: `A duplicata de R$${duplicata.valor} vence em ${duplicata.data_vencimento}.`,
    prioridade: diasParaVencer <= 3 ? "ALTA" : "MEDIA",
    entidade: "duplicatas",
    entidadeId: duplicata.id,
    metadata: { valor: duplicata.valor, data_vencimento: duplicata.data_vencimento, diasParaVencer }
  });

const notificarManutencaoPendente = async ({
  usuarioIds,
  veiculo,
  manutencao
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "MANUTENCAO_PENDENTE",
    titulo: `Manutenção pendente: ${veiculo.placa}`,
    mensagem: `O veículo ${veiculo.placa} possui manutenção preventiva pendente: ${manutencao.descricao || "sem descrição"}.`,
    prioridade: "ALTA",
    entidade: "manutencoes",
    entidadeId: manutencao.id,
    metadata: { placa: veiculo.placa, veiculo_id: veiculo.id }
  });

const notificarEntregaNaoConcluida = async ({
  usuarioIds,
  entrega
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "ENTREGA_NAO_CONCLUIDA",
    titulo: `Entrega não concluída #${entrega.id}`,
    mensagem: `A entrega #${entrega.id} não foi concluída dentro do prazo previsto.`,
    prioridade: "ALTA",
    entidade: "entregas",
    entidadeId: entrega.id,
    metadata: { status: entrega.status }
  });

const notificarEntregaConcluida = async ({
  usuarioIds,
  entrega
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "ENTREGA_CONCLUIDA",
    titulo: `Entrega concluída #${entrega.id}`,
    mensagem: `A entrega #${entrega.id} foi concluída com sucesso.`,
    prioridade: "BAIXA",
    entidade: "entregas",
    entidadeId: entrega.id,
    metadata: { status: entrega.status }
  });

const notificarStatusEntregaAlterado = async ({
  usuarioIds,
  entrega,
  statusAnterior,
  statusNovo
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "STATUS_ENTREGA_ALTERADO",
    titulo: `Status da entrega #${entrega.id} alterado`,
    mensagem: `Entrega #${entrega.id}: status alterado de "${statusAnterior}" para "${statusNovo}".`,
    prioridade: "MEDIA",
    entidade: "entregas",
    entidadeId: entrega.id,
    metadata: { statusAnterior, statusNovo }
  });

const notificarFreteDivergente = async ({
  usuarioIds,
  frete
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "FRETE_DIVERGENTE",
    titulo: `Custo real divergente no frete #${frete.id}`,
    mensagem: `O frete #${frete.id} apresenta divergência entre o custo calculado (R$${frete.custo_calculado}) e o custo real (R$${frete.custo_real}).`,
    prioridade: "ALTA",
    entidade: "fretes",
    entidadeId: frete.id,
    metadata: { custo_calculado: frete.custo_calculado, custo_real: frete.custo_real }
  });

const notificarVendaFuturaProxima = async ({
  usuarioIds,
  venda,
  diasParaVencer
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "VENDA_FUTURA_PROXIMA",
    titulo: `Venda futura próxima do vencimento`,
    mensagem: `A venda #${venda.id} está a ${diasParaVencer} dia(s) do vencimento.`,
    prioridade: diasParaVencer <= 3 ? "ALTA" : "MEDIA",
    entidade: "vendas",
    entidadeId: venda.id,
    metadata: { diasParaVencer }
  });

const notificarAlertaGeral = async ({
  usuarioIds,
  titulo,
  mensagem,
  prioridade = "MEDIA",
  entidade = null,
  entidadeId = null,
  metadata = null
}) =>
  notificarMultiplos(usuarioIds, {
    tipo: "ALERTA_GERAL",
    titulo,
    mensagem,
    prioridade,
    entidade,
    entidadeId,
    metadata
  });

module.exports = {
  notificar,
  notificarMultiplos,
  notificarEstoqueBaixo,
  notificarDuplicataVencida,
  notificarDuplicataVencendo,
  notificarManutencaoPendente,
  notificarEntregaNaoConcluida,
  notificarEntregaConcluida,
  notificarStatusEntregaAlterado,
  notificarFreteDivergente,
  notificarVendaFuturaProxima,
  notificarAlertaGeral
};
