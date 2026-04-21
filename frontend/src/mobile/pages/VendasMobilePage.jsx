import { useCallback, useEffect, useState } from "react";
import { IconButton, Stack } from "@mui/material";
import { MdAddShoppingCart, MdCancel, MdFilterList, MdVisibility } from "react-icons/md";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import VendaFormDialog from "../../components/vendas/VendaFormDialog";
import vendaService from "../../services/vendaService";
import { usePermission } from "../../hooks/usePermission";
import MobileActionBar from "../components/MobileActionBar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import MobileListItem from "../components/MobileListItem";
import MobilePageShell from "../components/MobilePageShell";
import { MobileEmptyState, MobileErrorState, MobileLoadingState } from "../components/MobileStateSection";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function VendasMobilePage() {
  const { canCreate, canUpdate } = usePermission();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelVenda, setCancelVenda] = useState(null);

  const carregarVendas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vendaService.listar({
        page: 1,
        limit: 20,
        ...(search ? { search } : {}),
        ...(tipoFilter ? { tipo_venda: tipoFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setVendas(response.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar vendas.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tipoFilter]);

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
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!cancelVenda) return;
    try {
      await vendaService.cancelar(cancelVenda.id, "Cancelamento via mobile");
      setCancelOpen(false);
      setCancelVenda(null);
      carregarVendas();
    } catch {
      // interceptor global
    }
  };

  if (loading) return <MobileLoadingState cards={4} />;
  if (error && !vendas.length) return <MobileErrorState message={error} onRetry={carregarVendas} />;

  return (
    <MobilePageShell title="Vendas" subtitle="Fluxo enxuto e orientado a toque">
      <MobileActionBar
        primaryAction={
          canCreate("vendas")
            ? {
                label: "Nova venda",
                icon: <MdAddShoppingCart size={18} />,
                onClick: () => setFormOpen(true),
              }
            : null
        }
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ alignSelf: "flex-end", width: 44, height: 44 }}>
          <MdFilterList size={22} />
        </IconButton>
      </MobileActionBar>

      <Stack spacing={1.5}>
        {vendas.length ? (
          vendas.map((venda) => (
            <MobileListItem
              key={venda.id}
              title={`Venda ${venda.numero}`}
              subtitle={`${venda.cliente_nome || "Cliente"} • ${formatDate(venda.data_venda)}`}
              meta={formatCurrency(venda.total_valor)}
              chips={[
                { label: venda.tipo_venda || "NORMAL", color: venda.tipo_venda === "DIRETA" ? "success" : "info" },
                { label: venda.status, color: venda.status === "CANCELADA" ? "error" : "default" },
              ]}
              details={[
                { label: "Pagamento", value: venda.forma_pagamento || "—" },
                { label: "Data", value: formatDate(venda.data_venda) },
                { label: "Total", value: formatCurrency(venda.total_valor), emphasis: true },
              ]}
              actions={[
                {
                  label: "Visualizar",
                  icon: <MdVisibility size={20} />,
                  onClick: () => {},
                },
                ...(canUpdate("vendas") && ["PENDENTE", "CONFIRMADA"].includes(venda.status)
                  ? [
                      {
                        label: "Cancelar",
                        icon: <MdCancel size={20} />,
                        color: "error",
                        onClick: () => {
                          setCancelVenda(venda);
                          setCancelOpen(true);
                        },
                      },
                    ]
                  : []),
              ]}
            />
          ))
        ) : (
          <MobileEmptyState title="Nenhuma venda encontrada" description="Crie uma nova venda ou revise os filtros." />
        )}
      </Stack>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Número ou cliente"
        filters={[
          {
            name: "tipo",
            label: "Tipo",
            value: tipoFilter,
            onChange: setTipoFilter,
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
            onChange: setStatusFilter,
            options: [
              { value: "PENDENTE", label: "Pendente" },
              { value: "CONFIRMADA", label: "Confirmada" },
              { value: "FATURADA", label: "Faturada" },
              { value: "CANCELADA", label: "Cancelada" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setTipoFilter("");
          setStatusFilter("");
        }}
      />

      <VendaFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} loading={formLoading} />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar venda"
        message={`Deseja cancelar a venda "${cancelVenda?.numero}"?`}
        onConfirm={handleCancelar}
        onCancel={() => {
          setCancelOpen(false);
          setCancelVenda(null);
        }}
      />
    </MobilePageShell>
  );
}
