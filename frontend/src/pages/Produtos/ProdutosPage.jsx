import { useState, useEffect, useCallback } from "react";
import { Box, Button, IconButton, Tooltip, Chip } from "@mui/material";
import { MdAdd, MdEdit, MdDoNotDisturb, MdWarning } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ProdutoFormDialog from "../../components/produtos/ProdutoFormDialog";
import { usePermission } from "../../hooks/usePermission";
import produtoService from "../../services/produtoService";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export default function ProdutosPage() {
  const { canCreate, canUpdate } = usePermission();

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editProduto, setEditProduto] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProduto, setConfirmProduto] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoriaFilter) params.categoria = categoriaFilter;

      const response = await produtoService.listar(params);
      setProdutos(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, categoriaFilter]);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

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
    } catch {
      // interceptor
    } finally {
      setFormLoading(false);
    }
  };

  const handleInativar = (produto) => {
    setConfirmProduto(produto);
    setConfirmOpen(true);
  };

  const handleConfirmInativar = async () => {
    if (!confirmProduto) return;
    setConfirmLoading(true);
    try {
      await produtoService.inativar(confirmProduto.id);
      setConfirmOpen(false);
      setConfirmProduto(null);
      carregarProdutos();
    } catch {
      // interceptor
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoriaFilter("");
    setPage(0);
  };

  const columns = [
    { field: "codigo", headerName: "Código" },
    { field: "nome", headerName: "Nome" },
    { field: "categoria", headerName: "Categoria" },
    { field: "unidade_medida", headerName: "Unid." },
    {
      field: "preco_venda",
      headerName: "Preço venda",
      align: "right",
      renderCell: (row) => formatCurrency(row.preco_venda),
    },
    {
      field: "estoque_minimo",
      headerName: "Est. mín.",
      align: "right",
      renderCell: (row) => {
        const val = parseFloat(row.estoque_minimo) || 0;
        return val > 0 ? (
          <Chip label={val} size="small" variant="outlined" icon={<MdWarning size={14} />} />
        ) : "—";
      },
    },
    {
      field: "ponto_reposicao",
      headerName: "Pt. repos.",
      align: "right",
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
          {canUpdate("produtos") && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => { setEditProduto(row); setFormOpen(true); }}>
                <MdEdit size={18} />
              </IconButton>
            </Tooltip>
          )}
          {canUpdate("produtos") && row.status === "ATIVO" && (
            <Tooltip title="Inativar">
              <IconButton size="small" color="error" onClick={() => handleInativar(row)}>
                <MdDoNotDisturb size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (error && !produtos.length) return <ErrorState message={error} onRetry={carregarProdutos} />;

  return (
    <Box>
      <PageHeader
        title="Produtos"
        subtitle="Gerenciamento de produtos"
        actions={
          canCreate("produtos") && (
            <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={() => { setEditProduto(null); setFormOpen(true); }}>
              Novo Produto
            </Button>
          )
        }
      />

      <FilterToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Buscar por nome, código ou código de barras..."
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(0); },
            options: [
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
            ],
          },
        ]}
        onClear={handleClearFilters}
      />

      <DataTable
        columns={columns}
        rows={produtos}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        emptyMessage="Nenhum produto encontrado"
      />

      <ProdutoFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduto(null); }}
        onSubmit={handleSubmit}
        produto={editProduto}
        loading={formLoading}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Inativar produto"
        message={`Deseja inativar o produto "${confirmProduto?.nome}"? Ele não poderá ser usado em novas vendas.`}
        onConfirm={handleConfirmInativar}
        onCancel={() => { setConfirmOpen(false); setConfirmProduto(null); }}
        loading={confirmLoading}
      />
    </Box>
  );
}
