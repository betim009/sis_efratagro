import { useCallback, useEffect, useState } from "react";
import { Chip, IconButton, Stack, Tab, Tabs } from "@mui/material";
import { MdAdd, MdFilterList, MdSwapHoriz, MdWarning } from "react-icons/md";
import MovimentacaoDialog from "../../components/estoque/MovimentacaoDialog";
import estoqueService from "../../services/estoqueService";
import { usePermission } from "../../hooks/usePermission";
import MobileActionBar from "../components/MobileActionBar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import MobileListItem from "../components/MobileListItem";
import MobilePageShell from "../components/MobilePageShell";
import MobileSection from "../components/MobileSection";
import { MobileEmptyState, MobileErrorState, MobileLoadingState } from "../components/MobileStateSection";
import { formatDateTime, formatQuantity } from "../utils/formatters";

export default function EstoqueMobilePage() {
  const { canCreate } = usePermission();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saldos, setSaldos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTipo, setDialogTipo] = useState("ENTRADA");
  const [dialogLoading, setDialogLoading] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resAlertas, resMain] = await Promise.all([
        estoqueService.getAlertasBaixoEstoque(),
        tab === 0
          ? estoqueService.listarSaldos({ page: 1, limit: 20, ...(search ? { search } : {}) })
          : estoqueService.listarMovimentacoes({ page: 1, limit: 20, ...(search ? { search } : {}) }),
      ]);

      setAlertas(resAlertas.data || []);
      if (tab === 0) {
        setSaldos(resMain.data?.items || []);
      } else {
        setMovimentacoes(resMain.data?.items || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  }, [search, tab]);

  useEffect(() => {
    const load = async () => {
      await carregarDados();
    };

    void load();
  }, [carregarDados]);

  const handleMovimentacao = async (data) => {
    setDialogLoading(true);
    try {
      const handlers = {
        ENTRADA: estoqueService.registrarEntrada,
        SAIDA: estoqueService.registrarSaida,
        TRANSFERENCIA: estoqueService.registrarTransferencia,
        AJUSTE: estoqueService.registrarAjuste,
        DEVOLUCAO_FORNECEDOR: estoqueService.registrarDevolucaoFornecedor,
        DEVOLUCAO_CLIENTE: estoqueService.registrarDevolucaoCliente,
      };
      await (handlers[data.tipo_movimentacao] || estoqueService.registrarEntrada)(data);
      setDialogOpen(false);
      carregarDados();
    } finally {
      setDialogLoading(false);
    }
  };

  if (loading) return <MobileLoadingState cards={4} />;
  if (error && !saldos.length && !movimentacoes.length) return <MobileErrorState message={error} onRetry={carregarDados} />;

  const rows = tab === 0 ? saldos : movimentacoes;

  return (
    <MobilePageShell title="Estoque" subtitle="Informação operacional em uma coluna">
      <MobileActionBar
        primaryAction={
          canCreate("estoque")
            ? {
                label: "Entrada",
                icon: <MdAdd size={18} />,
                onClick: () => {
                  setDialogTipo("ENTRADA");
                  setDialogOpen(true);
                },
              }
            : null
        }
        secondaryAction={
          canCreate("estoque")
            ? {
                label: "Transferência",
                icon: <MdSwapHoriz size={18} />,
                onClick: () => {
                  setDialogTipo("TRANSFERENCIA");
                  setDialogOpen(true);
                },
              }
            : null
        }
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ alignSelf: "flex-end", width: 44, height: 44 }}>
          <MdFilterList size={22} />
        </IconButton>
      </MobileActionBar>

      <MobileSection title="Alertas de estoque">
        <Stack spacing={1}>
          {alertas.slice(0, 3).map((alerta, index) => (
            <MobileListItem
              key={index}
              title={alerta.produto_nome || alerta.nome}
              subtitle="Reposição recomendada"
              meta={formatQuantity(alerta.saldo_atual ?? alerta.quantidade)}
              chips={[{ label: "Estoque baixo", color: "warning" }]}
              details={[
                { label: "Saldo atual", value: formatQuantity(alerta.saldo_atual ?? alerta.quantidade) },
                { label: "Mínimo", value: formatQuantity(alerta.estoque_minimo), emphasis: true },
              ]}
            />
          ))}
        </Stack>
      </MobileSection>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab label="Saldos" />
        <Tab label="Movimentações" />
      </Tabs>

      <Stack spacing={1.5}>
        {rows.length ? (
          rows.map((row) =>
            tab === 0 ? (
              <MobileListItem
                key={`${row.produto_id}-${row.local_id}`}
                title={row.produto_nome}
                subtitle={row.local_nome || "Local não informado"}
                meta={formatQuantity(row.quantidade)}
                chips={[
                  {
                    label:
                      (parseFloat(row.estoque_minimo) || 0) > 0 &&
                      (parseFloat(row.quantidade) || 0) <= (parseFloat(row.estoque_minimo) || 0)
                        ? "Baixo"
                        : "Normal",
                    color:
                      (parseFloat(row.estoque_minimo) || 0) > 0 &&
                      (parseFloat(row.quantidade) || 0) <= (parseFloat(row.estoque_minimo) || 0)
                        ? "warning"
                        : "success",
                  },
                ]}
                details={[
                  { label: "Reservado", value: formatQuantity(row.reservado) },
                  {
                    label: "Disponível",
                    value: formatQuantity((parseFloat(row.quantidade) || 0) - (parseFloat(row.reservado) || 0)),
                    emphasis: true,
                  },
                ]}
              />
            ) : (
              <MobileListItem
                key={row.id}
                title={row.produto_nome}
                subtitle={formatDateTime(row.data_movimentacao)}
                meta={formatQuantity(row.quantidade)}
                chips={[{ label: row.tipo_movimentacao, color: row.tipo_movimentacao === "SAIDA" ? "error" : "info" }]}
                details={[
                  { label: "Origem", value: row.local_origem_nome || "—" },
                  { label: "Destino", value: row.local_destino_nome || "—" },
                  { label: "Motivo", value: row.motivo || "—", emphasis: true },
                ]}
              />
            )
          )
        ) : (
          <MobileEmptyState
            icon={MdWarning}
            title={tab === 0 ? "Nenhum saldo encontrado" : "Nenhuma movimentação encontrada"}
            description="Use a busca para localizar itens específicos."
          />
        )}
      </Stack>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Buscar no estoque"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={tab === 0 ? "Produto ou local" : "Produto ou motivo"}
        filters={[]}
        onClear={() => setSearch("")}
      />

      <MovimentacaoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleMovimentacao}
        tipo={dialogTipo}
        loading={dialogLoading}
      />
    </MobilePageShell>
  );
}
