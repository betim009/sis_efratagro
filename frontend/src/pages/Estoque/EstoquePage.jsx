import { useState, useEffect, useCallback } from "react";
import { Box, Button, Tabs, Tab, Chip } from "@mui/material";
import { MdAdd, MdWarning } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import AlertBlock from "../../components/common/AlertBlock";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import MovimentacaoDialog from "../../components/estoque/MovimentacaoDialog";
import { usePermission } from "../../hooks/usePermission";
import estoqueService from "../../services/estoqueService";

function formatQty(val) {
  const n = parseFloat(val) || 0;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

export default function EstoquePage() {
  const { canCreate } = usePermission();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Saldos
  const [saldos, setSaldos] = useState([]);
  const [saldoSearch, setSaldoSearch] = useState("");
  const [saldoPage, setSaldoPage] = useState(0);
  const [saldoTotal, setSaldoTotal] = useState(0);

  // Movimentações
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [movSearch, setMovSearch] = useState("");
  const [movPage, setMovPage] = useState(0);
  const [movTotal, setMovTotal] = useState(0);

  // Alertas
  const [alertas, setAlertas] = useState([]);

  // Dialog
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movDialogTipo, setMovDialogTipo] = useState("ENTRADA");
  const [movDialogLoading, setMovDialogLoading] = useState(false);

  const carregarSaldos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: saldoPage + 1, limit: 25 };
      if (saldoSearch) params.search = saldoSearch;

      const response = await estoqueService.listarSaldos(params);
      setSaldos(response.data?.items || []);
      setSaldoTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar saldos.");
    } finally {
      setLoading(false);
    }
  }, [saldoPage, saldoSearch]);

  const carregarMovimentacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: movPage + 1, limit: 25 };
      if (movSearch) params.search = movSearch;

      const response = await estoqueService.listarMovimentacoes(params);
      setMovimentacoes(response.data?.items || []);
      setMovTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar movimentações.");
    } finally {
      setLoading(false);
    }
  }, [movPage, movSearch]);

  const carregarAlertas = useCallback(async () => {
    try {
      const response = await estoqueService.getAlertasBaixoEstoque();
      setAlertas(response.data || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (tab === 0) {
        await carregarSaldos();
        return;
      }

      await carregarMovimentacoes();
    };

    void load();
  }, [tab, carregarSaldos, carregarMovimentacoes]);

  useEffect(() => {
    const load = async () => {
      await carregarAlertas();
    };

    void load();
  }, [carregarAlertas]);

  const handleMovSubmit = async (data) => {
    setMovDialogLoading(true);
    try {
      const handler = {
        ENTRADA: estoqueService.registrarEntrada,
        SAIDA: estoqueService.registrarSaida,
        TRANSFERENCIA: estoqueService.registrarTransferencia,
      }[data.tipo_movimentacao] || estoqueService.registrarEntrada;

      await handler(data);
      setMovDialogOpen(false);
      if (tab === 0) carregarSaldos(); else carregarMovimentacoes();
      carregarAlertas();
    } catch {
      // interceptor
    } finally {
      setMovDialogLoading(false);
    }
  };

  const openMovDialog = (tipo) => {
    setMovDialogTipo(tipo);
    setMovDialogOpen(true);
  };

  const alertaItems = alertas.map(
    (a) => `${a.produto_nome || a.nome || "Produto"} — saldo: ${formatQty(a.quantidade ?? a.saldo_atual)} (mín: ${formatQty(a.estoque_minimo)})`
  );

  const saldoColumns = [
    { field: "produto_codigo", headerName: "Código" },
    { field: "produto_nome", headerName: "Produto" },
    { field: "local_nome", headerName: "Local" },
    {
      field: "quantidade",
      headerName: "Quantidade",
      align: "right",
      renderCell: (row) => {
        const qty = parseFloat(row.quantidade) || 0;
        const min = parseFloat(row.estoque_minimo) || 0;
        const isBaixo = min > 0 && qty <= min;
        return (
          <Chip
            label={formatQty(qty)}
            size="small"
            color={isBaixo ? "error" : "default"}
            variant={isBaixo ? "filled" : "outlined"}
            icon={isBaixo ? <MdWarning size={14} /> : undefined}
          />
        );
      },
    },
    { field: "reservado", headerName: "Reservado", align: "right", renderCell: (row) => formatQty(row.reservado) },
    {
      field: "disponivel",
      headerName: "Disponível",
      align: "right",
      renderCell: (row) => formatQty((parseFloat(row.quantidade) || 0) - (parseFloat(row.reservado) || 0)),
    },
  ];

  const movColumns = [
    {
      field: "data_movimentacao",
      headerName: "Data",
      renderCell: (row) => row.data_movimentacao ? new Date(row.data_movimentacao).toLocaleString("pt-BR") : "—",
    },
    {
      field: "tipo_movimentacao",
      headerName: "Tipo",
      renderCell: (row) => {
        const colors = { ENTRADA: "success", SAIDA: "error", TRANSFERENCIA: "info", AJUSTE: "warning" };
        return <Chip label={row.tipo_movimentacao} size="small" color={colors[row.tipo_movimentacao] || "default"} />;
      },
    },
    { field: "produto_nome", headerName: "Produto" },
    { field: "quantidade", headerName: "Qtd.", align: "right", renderCell: (row) => formatQty(row.quantidade) },
    { field: "local_origem_nome", headerName: "Origem" },
    { field: "local_destino_nome", headerName: "Destino" },
    { field: "motivo", headerName: "Motivo" },
  ];

  if (error && !saldos.length && !movimentacoes.length) {
    return <ErrorState message={error} onRetry={tab === 0 ? carregarSaldos : carregarMovimentacoes} />;
  }

  return (
    <Box>
      <PageHeader
        title="Estoque"
        subtitle="Controle de estoque e movimentações"
        actions={
          canCreate("estoque") && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={() => openMovDialog("ENTRADA")}>
                Entrada
              </Button>
              <Button variant="outlined" onClick={() => openMovDialog("SAIDA")}>
                Saída
              </Button>
              <Button variant="outlined" onClick={() => openMovDialog("TRANSFERENCIA")}>
                Transferência
              </Button>
            </Box>
          )
        }
      />

      {alertaItems.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <AlertBlock title="Produtos com estoque baixo" items={alertaItems} severity="warning" />
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Saldos" />
        <Tab label="Movimentações" />
      </Tabs>

      {tab === 0 && (
        <>
          <FilterToolbar
            searchValue={saldoSearch}
            onSearchChange={(v) => { setSaldoSearch(v); setSaldoPage(0); }}
            searchPlaceholder="Buscar produto..."
            onClear={() => { setSaldoSearch(""); setSaldoPage(0); }}
          />
          <DataTable
            columns={saldoColumns}
            rows={saldos}
            loading={loading}
            page={saldoPage}
            rowsPerPage={25}
            total={saldoTotal}
            onPageChange={(_, p) => setSaldoPage(p)}
            emptyMessage="Nenhum saldo de estoque encontrado"
          />
        </>
      )}

      {tab === 1 && (
        <>
          <FilterToolbar
            searchValue={movSearch}
            onSearchChange={(v) => { setMovSearch(v); setMovPage(0); }}
            searchPlaceholder="Buscar movimentação..."
            onClear={() => { setMovSearch(""); setMovPage(0); }}
          />
          <DataTable
            columns={movColumns}
            rows={movimentacoes}
            loading={loading}
            page={movPage}
            rowsPerPage={25}
            total={movTotal}
            onPageChange={(_, p) => setMovPage(p)}
            emptyMessage="Nenhuma movimentação encontrada"
          />
        </>
      )}

      <MovimentacaoDialog
        open={movDialogOpen}
        onClose={() => setMovDialogOpen(false)}
        onSubmit={handleMovSubmit}
        tipo={movDialogTipo}
        loading={movDialogLoading}
      />
    </Box>
  );
}
