import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Card, CardContent, Typography, IconButton, Tooltip } from "@mui/material";
import { MdPayment, MdVisibility } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import AlertBlock from "../../components/common/AlertBlock";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import PagamentoDialog from "../../components/financeiro/PagamentoDialog";
import { usePermission } from "../../hooks/usePermission";
import financeiroService from "../../services/financeiroService";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function isVencida(duplicata) {
  return duplicata.status === "VENCIDO" || (
    duplicata.status !== "PAGO" && duplicata.status !== "CANCELADO" &&
    new Date(duplicata.vencimento) < new Date()
  );
}

function isVencendoBreve(duplicata) {
  if (duplicata.status === "PAGO" || duplicata.status === "CANCELADO") return false;
  const venc = new Date(duplicata.vencimento);
  const hoje = new Date();
  const diff = (venc - hoje) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

export default function FinanceiroPage() {
  const { canCreate } = usePermission();

  const [duplicatas, setDuplicatas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [resumo, setResumo] = useState(null);
  const [alertasVencidas, setAlertasVencidas] = useState([]);
  const [alertasVencendo, setAlertasVencendo] = useState([]);

  const [pagDialogOpen, setPagDialogOpen] = useState(false);
  const [pagDuplicata, setPagDuplicata] = useState(null);
  const [pagLoading, setPagLoading] = useState(false);

  const carregarDuplicatas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await financeiroService.listarDuplicatas(params);
      setDuplicatas(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar duplicatas.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  const carregarResumoEAlertas = useCallback(async () => {
    try {
      const [resResumo, resVencidas, resVencendo] = await Promise.allSettled([
        financeiroService.getResumo(),
        financeiroService.getAlertasVencidas(),
        financeiroService.getAlertasVencendo(),
      ]);
      if (resResumo.status === "fulfilled") setResumo(resResumo.value.data);
      if (resVencidas.status === "fulfilled") setAlertasVencidas(resVencidas.value.data || []);
      if (resVencendo.status === "fulfilled") setAlertasVencendo(resVencendo.value.data || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await carregarDuplicatas();
    };

    void load();
  }, [carregarDuplicatas]);

  useEffect(() => {
    const load = async () => {
      await carregarResumoEAlertas();
    };

    void load();
  }, [carregarResumoEAlertas]);

  const handlePagamento = (duplicata) => {
    setPagDuplicata(duplicata);
    setPagDialogOpen(true);
  };

  const handlePagSubmit = async (duplicataId, data) => {
    setPagLoading(true);
    try {
      await financeiroService.registrarPagamento(duplicataId, data);
      setPagDialogOpen(false);
      setPagDuplicata(null);
      carregarDuplicatas();
      carregarResumoEAlertas();
    } catch {
      // interceptor
    } finally {
      setPagLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(0);
  };

  const vencidasItems = (Array.isArray(alertasVencidas) ? alertasVencidas : []).map(
    (d) => `${d.numero} — ${d.cliente_nome || "Cliente"} — ${formatCurrency(d.valor_aberto)}`
  );

  const vencendoItems = (Array.isArray(alertasVencendo) ? alertasVencendo : []).map(
    (d) => `${d.numero} — vence em ${formatDate(d.vencimento)} — ${formatCurrency(d.valor_aberto)}`
  );

  const columns = [
    { field: "numero", headerName: "Número" },
    { field: "parcela", headerName: "Parc.", align: "center" },
    { field: "cliente_nome", headerName: "Cliente" },
    {
      field: "valor_total",
      headerName: "Valor total",
      align: "right",
      renderCell: (row) => formatCurrency(row.valor_total),
    },
    {
      field: "valor_aberto",
      headerName: "Valor aberto",
      align: "right",
      renderCell: (row) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: parseFloat(row.valor_aberto) > 0 ? 600 : 400, color: parseFloat(row.valor_aberto) > 0 ? "error.main" : "text.secondary" }}
        >
          {formatCurrency(row.valor_aberto)}
        </Typography>
      ),
    },
    {
      field: "vencimento",
      headerName: "Vencimento",
      renderCell: (row) => {
        const vencida = isVencida(row);
        const vencendo = isVencendoBreve(row);
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: vencida || vencendo ? 600 : 400,
              color: vencida ? "error.main" : vencendo ? "warning.main" : "text.primary",
            }}
          >
            {formatDate(row.vencimento)}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      align: "center",
      renderCell: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Visualizar">
            <IconButton size="small">
              <MdVisibility size={18} />
            </IconButton>
          </Tooltip>
          {canCreate("financeiro") && row.status !== "PAGO" && row.status !== "CANCELADO" && (
            <Tooltip title="Registrar pagamento">
              <IconButton size="small" color="success" onClick={() => handlePagamento(row)}>
                <MdPayment size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (error && !duplicatas.length) return <ErrorState message={error} onRetry={carregarDuplicatas} />;

  return (
    <Box>
      <PageHeader title="Financeiro" subtitle="Controle financeiro e duplicatas" />

      {/* Cards de resumo */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Em aberto</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "warning.main" }}>
                {formatCurrency(resumo?.total_em_aberto)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resumo?.qtd_em_aberto ?? 0} duplicata(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vencidas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>
                {formatCurrency(resumo?.total_vencido)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resumo?.qtd_vencidas ?? 0} duplicata(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pagas (mês)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>
                {formatCurrency(resumo?.total_pago_mes)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resumo?.qtd_pagas_mes ?? 0} duplicata(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {vencidasItems.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <AlertBlock title="Duplicatas vencidas" items={vencidasItems} severity="error" />
          </Grid>
        )}
        {vencendoItems.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <AlertBlock title="Vencendo nos próximos 7 dias" items={vencendoItems} severity="warning" />
          </Grid>
        )}
      </Grid>

      {/* Filtros e tabela */}
      <FilterToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Buscar por número ou cliente..."
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(0); },
            options: [
              { value: "EM_ABERTO", label: "Em aberto" },
              { value: "PAGO_PARCIALMENTE", label: "Pago parcialmente" },
              { value: "PAGO", label: "Pago" },
              { value: "VENCIDO", label: "Vencido" },
              { value: "CANCELADO", label: "Cancelado" },
            ],
          },
        ]}
        onClear={handleClearFilters}
      />

      <DataTable
        columns={columns}
        rows={duplicatas}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        emptyMessage="Nenhuma duplicata encontrada"
      />

      <PagamentoDialog
        open={pagDialogOpen}
        onClose={() => { setPagDialogOpen(false); setPagDuplicata(null); }}
        onSubmit={handlePagSubmit}
        duplicata={pagDuplicata}
        loading={pagLoading}
      />
    </Box>
  );
}
