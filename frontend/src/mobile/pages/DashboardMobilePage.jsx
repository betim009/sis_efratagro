import { useCallback, useEffect, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from "@mui/material";
import {
  MdAttachMoney,
  MdExpandMore,
  MdInventory,
  MdLocalShipping,
  MdPeople,
  MdPointOfSale,
  MdStore,
  MdTrendingUp,
} from "react-icons/md";
import dashboardService from "../../services/dashboardService";
import MobilePageShell from "../components/MobilePageShell";
import MobileSection from "../components/MobileSection";
import MobileStatCard from "../components/MobileStatCard";
import MobileCard from "../components/MobileCard";
import { MobileErrorState, MobileLoadingState } from "../components/MobileStateSection";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function DashboardMobilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [financeiro, setFinanceiro] = useState(null);
  const [estoque, setEstoque] = useState(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resResumo, resFinanceiro, resEstoque] = await Promise.all([
        dashboardService.getResumo(),
        dashboardService.getFinanceiro(),
        dashboardService.getEstoque(),
      ]);
      setResumo(resResumo.data);
      setFinanceiro(resFinanceiro.data);
      setEstoque(resEstoque.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar dashboard mobile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await carregarDados();
    };

    void load();
  }, [carregarDados]);

  if (loading) {
    return <MobileLoadingState cards={4} />;
  }

  if (error && !resumo) {
    return <MobileErrorState message={error} onRetry={carregarDados} />;
  }

  const stats = [
    { title: "Clientes ativos", value: resumo?.total_clientes ?? "—", helper: "Base ativa", icon: MdPeople, color: "#1B5E20" },
    { title: "Fornecedores", value: resumo?.total_fornecedores ?? "—", helper: "Relacionamento", icon: MdStore, color: "#0288D1" },
    { title: "Produtos ativos", value: resumo?.total_produtos ?? "—", helper: "Catálogo", icon: MdInventory, color: "#ED6C02" },
    { title: "Vendas do mês", value: resumo?.vendas_mes ?? "—", helper: "Operação", icon: MdPointOfSale, color: "#7B1FA2" },
  ];

  const alertas = [
    ...(estoque?.alertas_baixo_estoque || []).map((item) => ({
      grupo: "Estoque baixo",
      texto: `${item.produto_nome || item.nome} com saldo ${item.saldo_atual ?? item.quantidade}`,
    })),
    ...(financeiro?.duplicatas_vencendo || []).map((item) => ({
      grupo: "Vencendo",
      texto: `${item.numero} vence em ${formatDate(item.vencimento)}`,
    })),
  ];

  return (
    <MobilePageShell title="Operação em campo" subtitle="Resumo rápido para uso mobile">
      <MobileSection title="Indicadores" subtitle="Blocos enxutos e de leitura rápida">
        <Stack spacing={1.5}>
          {stats.map((stat) => (
            <MobileStatCard key={stat.title} {...stat} />
          ))}
        </Stack>
      </MobileSection>

      <MobileSection title="Financeiro" subtitle="Resumo sem tabela">
        <Stack spacing={1.5}>
          <MobileCard>
            <Typography variant="body2" color="text.secondary">
              A receber
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
              {formatCurrency(financeiro?.total_a_receber)}
            </Typography>
            <Chip label={`${financeiro?.total_duplicatas_abertas ?? 0} duplicatas`} color="warning" variant="outlined" sx={{ mt: 1 }} />
          </MobileCard>

          <MobileCard>
            <Typography variant="body2" color="text.secondary">
              Recebido no mês
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
              {formatCurrency(financeiro?.total_recebido_mes)}
            </Typography>
            <Chip label={`${financeiro?.total_pagamentos_mes ?? 0} pagamentos`} color="success" variant="outlined" sx={{ mt: 1 }} />
          </MobileCard>
        </Stack>
      </MobileSection>

      <MobileSection title="Alertas" subtitle="Conteúdo colapsável para reduzir densidade">
        <Accordion disableGutters sx={{ borderRadius: 4, overflow: "hidden" }}>
          <AccordionSummary expandIcon={<MdExpandMore size={20} />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MdTrendingUp size={18} />
              <Typography sx={{ fontWeight: 700 }}>Itens que pedem atenção</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.25}>
              {alertas.length > 0 ? (
                alertas.map((alerta, index) => (
                  <MobileCard key={`${alerta.grupo}-${index}`} sx={{ bgcolor: "background.default" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {alerta.grupo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alerta.texto}
                    </Typography>
                  </MobileCard>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum alerta no momento.
                </Typography>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <MobileCard sx={{ background: "linear-gradient(135deg, rgba(27,94,32,0.08), rgba(249,168,37,0.16))" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MdLocalShipping size={22} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Entregas ativas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resumo?.entregas_ativas ?? 0} operações acompanhadas no período.
              </Typography>
            </Box>
          </Box>
        </MobileCard>
      </MobileSection>
    </MobilePageShell>
  );
}
