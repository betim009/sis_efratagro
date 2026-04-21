import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Card, CardContent, Typography, TextField, MenuItem } from "@mui/material";
import {
  MdPeople, MdStore, MdInventory, MdPointOfSale,
  MdAttachMoney, MdLocalShipping, MdTrendingUp, MdTrendingDown,
} from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import AlertBlock from "../../components/common/AlertBlock";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import dashboardService from "../../services/dashboardService";

const PERIODOS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "12m", label: "Últimos 12 meses" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [financeiro, setFinanceiro] = useState(null);
  const [estoque, setEstoque] = useState(null);
  const [periodo, setPeriodo] = useState("30d");

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resResumo, resFin, resEst] = await Promise.allSettled([
        dashboardService.getResumo(),
        dashboardService.getFinanceiro(),
        dashboardService.getEstoque(),
      ]);
      if (resResumo.status === "fulfilled") setResumo(resResumo.value.data);
      if (resFin.status === "fulfilled") setFinanceiro(resFin.value.data);
      if (resEst.status === "fulfilled") setEstoque(resEst.value.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar o dashboard.");
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

  if (loading) return <Loading message="Carregando dashboard..." />;
  if (error && !resumo) return <ErrorState message={error} onRetry={carregarDados} />;

  const stats = [
    { title: "Clientes ativos", value: resumo?.total_clientes ?? "—", icon: MdPeople, color: "#1B5E20" },
    { title: "Fornecedores", value: resumo?.total_fornecedores ?? "—", icon: MdStore, color: "#0288D1" },
    { title: "Produtos ativos", value: resumo?.total_produtos ?? "—", icon: MdInventory, color: "#ED6C02" },
    { title: "Vendas (mês)", value: resumo?.vendas_mes ?? "—", icon: MdPointOfSale, color: "#9C27B0" },
    { title: "Receita (mês)", value: formatCurrency(resumo?.receita_mes), icon: MdTrendingUp, color: "#2E7D32" },
    { title: "Entregas ativas", value: resumo?.entregas_ativas ?? "—", icon: MdLocalShipping, color: "#D32F2F" },
  ];

  const alertasEstoque = estoque?.alertas_baixo_estoque?.map(
    (a) => `${a.produto_nome || a.nome} — saldo: ${a.saldo_atual ?? a.quantidade}`
  ) || [];

  const alertasVencimento = financeiro?.duplicatas_vencendo?.map(
    (d) => `${d.numero} — ${d.cliente_nome || "Cliente"} — vence em ${new Date(d.vencimento).toLocaleDateString("pt-BR")}`
  ) || [];

  const alertasVencidas = financeiro?.duplicatas_vencidas?.map(
    (d) => `${d.numero} — ${d.cliente_nome || "Cliente"} — ${formatCurrency(d.valor_aberto)}`
  ) || [];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema"
        actions={
          <TextField
            select
            size="small"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {PERIODOS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
        }
      />

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.title}>
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
          </Grid>
        ))}
      </Grid>

      {/* Resumo financeiro */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>A receber</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                {formatCurrency(financeiro?.total_a_receber)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {financeiro?.total_duplicatas_abertas ?? 0} duplicata(s) em aberto
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vencido</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F" }}>
                {formatCurrency(financeiro?.total_vencido)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {financeiro?.total_duplicatas_vencidas ?? 0} duplicata(s) vencida(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Recebido (mês)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#0288D1" }}>
                {formatCurrency(financeiro?.total_recebido_mes)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {financeiro?.total_pagamentos_mes ?? 0} pagamento(s) registrado(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Área para gráfico */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <MdTrendingUp size={40} color="#BDBDBD" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gráfico de séries de vendas será integrado aqui
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Endpoint: GET /dashboard/series/vendas
          </Typography>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Grid container spacing={3}>
        {alertasVencidas.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertBlock title="Duplicatas vencidas" items={alertasVencidas} severity="error" />
          </Grid>
        )}
        {alertasVencimento.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertBlock title="Vencendo em breve" items={alertasVencimento} severity="warning" />
          </Grid>
        )}
        {alertasEstoque.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertBlock title="Estoque baixo" items={alertasEstoque} severity="warning" />
          </Grid>
        )}
        {!alertasVencidas.length && !alertasVencimento.length && !alertasEstoque.length && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum alerta no momento.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
