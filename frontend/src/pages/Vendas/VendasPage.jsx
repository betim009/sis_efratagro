import { useState, useEffect, useCallback } from "react";
import { Box, Button, IconButton, Tooltip, Chip } from "@mui/material";
import { MdAdd, MdVisibility, MdCancel } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import VendaFormDialog from "../../components/vendas/VendaFormDialog";
import { usePermission } from "../../hooks/usePermission";
import vendaService from "../../services/vendaService";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

const TIPO_COLORS = { NORMAL: "default", FUTURA: "info", DIRETA: "success" };

export default function VendasPage() {
  const { canCreate, canUpdate } = usePermission();

  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelVenda, setCancelVenda] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const carregarVendas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (tipoFilter) params.tipo_venda = tipoFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await vendaService.listar(params);
      setVendas(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar vendas.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, tipoFilter, statusFilter]);

  useEffect(() => {
    const load = async () => {
      await carregarVendas();
    };

    void load();
  }, [carregarVendas]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      await vendaService.criar(data);
      setFormOpen(false);
      carregarVendas();
    } catch {
      // interceptor
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelar = (venda) => {
    setCancelVenda(venda);
    setCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelVenda) return;
    setCancelLoading(true);
    try {
      await vendaService.cancelar(cancelVenda.id, "Cancelamento via interface");
      setCancelOpen(false);
      setCancelVenda(null);
      carregarVendas();
    } catch {
      // interceptor
    } finally {
      setCancelLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setTipoFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const columns = [
    { field: "numero", headerName: "Número" },
    {
      field: "data_venda",
      headerName: "Data",
      renderCell: (row) => row.data_venda ? new Date(row.data_venda).toLocaleDateString("pt-BR") : "—",
    },
    { field: "cliente_nome", headerName: "Cliente" },
    {
      field: "tipo_venda",
      headerName: "Tipo",
      renderCell: (row) => (
        <Chip
          label={row.tipo_venda}
          size="small"
          color={TIPO_COLORS[row.tipo_venda] || "default"}
          variant={row.tipo_venda === "FUTURA" ? "filled" : "outlined"}
        />
      ),
    },
    { field: "forma_pagamento", headerName: "Pagamento" },
    {
      field: "total_valor",
      headerName: "Total",
      align: "right",
      renderCell: (row) => formatCurrency(row.total_valor),
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
          {canUpdate("vendas") && (row.status === "PENDENTE" || row.status === "CONFIRMADA") && (
            <Tooltip title="Cancelar">
              <IconButton size="small" color="error" onClick={() => handleCancelar(row)}>
                <MdCancel size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (error && !vendas.length) return <ErrorState message={error} onRetry={carregarVendas} />;

  return (
    <Box>
      <PageHeader
        title="Vendas"
        subtitle="Gerenciamento de vendas e pedidos"
        actions={
          canCreate("vendas") && (
            <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={() => setFormOpen(true)}>
              Nova Venda
            </Button>
          )
        }
      />

      <FilterToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Buscar por número ou cliente..."
        filters={[
          {
            name: "tipo_venda",
            label: "Tipo",
            value: tipoFilter,
            onChange: (v) => { setTipoFilter(v); setPage(0); },
            options: [
              { value: "NORMAL", label: "Normal" },
              { value: "FUTURA", label: "Futura" },
              { value: "DIRETA", label: "Direta" },
            ],
          },
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(0); },
            options: [
              { value: "PENDENTE", label: "Pendente" },
              { value: "CONFIRMADA", label: "Confirmada" },
              { value: "FATURADA", label: "Faturada" },
              { value: "CANCELADA", label: "Cancelada" },
            ],
          },
        ]}
        onClear={handleClearFilters}
      />

      <DataTable
        columns={columns}
        rows={vendas}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        emptyMessage="Nenhuma venda encontrada"
      />

      <VendaFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar venda"
        message={`Deseja cancelar a venda "${cancelVenda?.numero}"? Esta ação não pode ser desfeita.`}
        confirmText="Cancelar venda"
        onConfirm={handleConfirmCancel}
        onCancel={() => { setCancelOpen(false); setCancelVenda(null); }}
        loading={cancelLoading}
      />
    </Box>
  );
}
