import { useCallback, useEffect, useState } from "react";
import { Chip, IconButton, Stack } from "@mui/material";
import { MdAddBusiness, MdDoNotDisturb, MdEdit, MdFilterList, MdWarning } from "react-icons/md";
import ProdutoFormDialog from "../../components/produtos/ProdutoFormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import produtoService from "../../services/produtoService";
import { usePermission } from "../../hooks/usePermission";
import MobileActionBar from "../components/MobileActionBar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import MobileListItem from "../components/MobileListItem";
import MobilePageShell from "../components/MobilePageShell";
import MobileSection from "../components/MobileSection";
import { MobileEmptyState, MobileErrorState, MobileLoadingState } from "../components/MobileStateSection";
import { formatCurrency } from "../utils/formatters";

export default function ProdutosMobilePage() {
  const { canCreate, canUpdate } = usePermission();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editProduto, setEditProduto] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProduto, setConfirmProduto] = useState(null);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await produtoService.listar({
        page: 1,
        limit: 20,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setProdutos(response.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const load = async () => {
      await carregarProdutos();
    };

    void load();
  }, [carregarProdutos]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editProduto?.id) {
        await produtoService.atualizar(editProduto.id, data);
      } else {
        await produtoService.criar(data);
      }
      setFormOpen(false);
      setEditProduto(null);
      carregarProdutos();
    } finally {
      setFormLoading(false);
    }
  };

  const handleInativar = async () => {
    if (!confirmProduto) return;
    try {
      await produtoService.inativar(confirmProduto.id);
      setConfirmOpen(false);
      setConfirmProduto(null);
      carregarProdutos();
    } catch {
      // interceptor global
    }
  };

  if (loading) return <MobileLoadingState cards={4} />;
  if (error && !produtos.length) return <MobileErrorState message={error} onRetry={carregarProdutos} />;

  return (
    <MobilePageShell title="Produtos" subtitle="Cards substituem a grade densa do desktop">
      <MobileActionBar
        primaryAction={
          canCreate("produtos")
            ? {
                label: "Novo produto",
                icon: <MdAddBusiness size={18} />,
                onClick: () => {
                  setEditProduto(null);
                  setFormOpen(true);
                },
              }
            : null
        }
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ alignSelf: "flex-end", width: 44, height: 44 }}>
          <MdFilterList size={22} />
        </IconButton>
      </MobileActionBar>

      <Stack spacing={1.5}>
        {produtos.length ? (
          produtos.map((produto) => {
            const estoqueMinimo = parseFloat(produto.estoque_minimo) || 0;
            return (
              <MobileListItem
                key={produto.id}
                title={produto.nome}
                subtitle={`${produto.codigo || "Sem código"} • ${produto.categoria || "Sem categoria"}`}
                meta={formatCurrency(produto.preco_venda)}
                chips={[
                  { label: produto.status, color: produto.status === "ATIVO" ? "success" : "default" },
                  ...(estoqueMinimo > 0
                    ? [{ label: `Est. mín. ${estoqueMinimo}`, color: "warning", variant: "outlined" }]
                    : []),
                ]}
                details={[
                  { label: "Unidade", value: produto.unidade_medida || "—" },
                  { label: "Ponto reposição", value: produto.ponto_reposicao || "—" },
                  { label: "Preço venda", value: formatCurrency(produto.preco_venda), emphasis: true },
                ]}
                actions={[
                  ...(canUpdate("produtos")
                    ? [
                        {
                          label: "Editar",
                          icon: <MdEdit size={20} />,
                          onClick: () => {
                            setEditProduto(produto);
                            setFormOpen(true);
                          },
                        },
                      ]
                    : []),
                  ...(canUpdate("produtos") && produto.status === "ATIVO"
                    ? [
                        {
                          label: "Inativar",
                          icon: <MdDoNotDisturb size={20} />,
                          color: "error",
                          onClick: () => {
                            setConfirmProduto(produto);
                            setConfirmOpen(true);
                          },
                        },
                      ]
                    : []),
                ]}
              />
            );
          })
        ) : (
          <MobileEmptyState
            icon={MdWarning}
            title="Nenhum produto encontrado"
            description="Use filtros diferentes ou cadastre um novo item."
          />
        )}
      </Stack>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nome, código ou código de barras"
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setStatusFilter("");
        }}
      />

      <ProdutoFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditProduto(null);
        }}
        onSubmit={handleSubmit}
        produto={editProduto}
        loading={formLoading}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Inativar produto"
        message={`Deseja inativar o produto "${confirmProduto?.nome}"?`}
        onConfirm={handleInativar}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmProduto(null);
        }}
      />
    </MobilePageShell>
  );
}
