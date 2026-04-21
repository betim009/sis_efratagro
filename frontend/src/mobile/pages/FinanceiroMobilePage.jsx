import { useCallback, useEffect, useState } from "react";
import { IconButton, Stack } from "@mui/material";
import { MdFilterList, MdPayment, MdVisibility } from "react-icons/md";
import PagamentoDialog from "../../components/financeiro/PagamentoDialog";
import financeiroService from "../../services/financeiroService";
import { usePermission } from "../../hooks/usePermission";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import MobileListItem from "../components/MobileListItem";
import MobilePageShell from "../components/MobilePageShell";
import MobileSection from "../components/MobileSection";
import MobileStatCard from "../components/MobileStatCard";
import { MobileEmptyState, MobileErrorState, MobileLoadingState } from "../components/MobileStateSection";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function FinanceiroMobilePage() {
  const { canCreate } = usePermission();
  const [duplicatas, setDuplicatas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDuplicata, setSelectedDuplicata] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resLista, resResumo] = await Promise.all([
        financeiroService.listarDuplicatas({
          page: 1,
          limit: 20,
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        }),
        financeiroService.getResumo(),
      ]);
      setDuplicatas(resLista.data?.items || []);
      setResumo(resResumo.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar financeiro.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const load = async () => {
      await carregarDados();
    };

    void load();
  }, [carregarDados]);

  const handlePagamento = async (duplicataId, data) => {
    setDialogLoading(true);
    try {
      await financeiroService.registrarPagamento(duplicataId, data);
      setDialogOpen(false);
      setSelectedDuplicata(null);
      carregarDados();
    } finally {
      setDialogLoading(false);
    }
  };

  if (loading) return <MobileLoadingState cards={4} />;
  if (error && !duplicatas.length) return <MobileErrorState message={error} onRetry={carregarDados} />;

  return (
    <MobilePageShell title="Financeiro" subtitle="Resumo em blocos e duplicatas em lista">
      <MobileSection
        title="Resumo"
        action={
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ width: 44, height: 44 }}>
            <MdFilterList size={22} />
          </IconButton>
        }
      >
        <Stack spacing={1.5}>
          <MobileStatCard title="Em aberto" value={formatCurrency(resumo?.total_em_aberto)} helper={`${resumo?.qtd_em_aberto ?? 0} duplicatas`} color="#ED6C02" />
          <MobileStatCard title="Vencidas" value={formatCurrency(resumo?.total_vencido)} helper={`${resumo?.qtd_vencidas ?? 0} títulos`} color="#D32F2F" />
          <MobileStatCard title="Pagas no mês" value={formatCurrency(resumo?.total_pago_mes)} helper={`${resumo?.qtd_pagas_mes ?? 0} pagamentos`} color="#2E7D32" />
        </Stack>
      </MobileSection>

      <Stack spacing={1.5}>
        {duplicatas.length ? (
          duplicatas.map((duplicata) => (
            <MobileListItem
              key={duplicata.id}
              title={duplicata.numero}
              subtitle={`${duplicata.cliente_nome || "Cliente"} • vence ${formatDate(duplicata.vencimento)}`}
              meta={formatCurrency(duplicata.valor_aberto)}
              chips={[
                { label: duplicata.status, color: ["VENCIDO", "CANCELADO"].includes(duplicata.status) ? "error" : "default" },
              ]}
              details={[
                { label: "Parcela", value: duplicata.parcela || "—" },
                { label: "Valor total", value: formatCurrency(duplicata.valor_total) },
                { label: "Aberto", value: formatCurrency(duplicata.valor_aberto), emphasis: true },
              ]}
              actions={[
                {
                  label: "Visualizar",
                  icon: <MdVisibility size={20} />,
                  onClick: () => {},
                },
                ...(canCreate("financeiro") && !["PAGO", "CANCELADO"].includes(duplicata.status)
                  ? [
                      {
                        label: "Pagar",
                        icon: <MdPayment size={20} />,
                        color: "success",
                        onClick: () => {
                          setSelectedDuplicata(duplicata);
                          setDialogOpen(true);
                        },
                      },
                    ]
                  : []),
              ]}
            />
          ))
        ) : (
          <MobileEmptyState title="Nenhuma duplicata encontrada" description="Ajuste a busca ou remova filtros." />
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
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "EM_ABERTO", label: "Em aberto" },
              { value: "PAGO_PARCIALMENTE", label: "Pago parcialmente" },
              { value: "PAGO", label: "Pago" },
              { value: "VENCIDO", label: "Vencido" },
              { value: "CANCELADO", label: "Cancelado" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setStatusFilter("");
        }}
      />

      <PagamentoDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedDuplicata(null);
        }}
        onSubmit={handlePagamento}
        duplicata={selectedDuplicata}
        loading={dialogLoading}
      />
    </MobilePageShell>
  );
}
