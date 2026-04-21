import { useState, useEffect, useCallback } from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { MdAdd, MdEdit, MdBlock, MdCheckCircle } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ClienteFormDialog from "../../components/clientes/ClienteFormDialog";
import { usePermission } from "../../hooks/usePermission";
import clienteService from "../../services/clienteService";

export default function ClientesPage() {
  const { canCreate, canUpdate } = usePermission();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editCliente, setEditCliente] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await clienteService.listar(params);
      setClientes(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    const load = async () => {
      await carregarClientes();
    };

    void load();
  }, [carregarClientes]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editCliente?.id) {
        await clienteService.atualizar(editCliente.id, data);
      } else {
        await clienteService.criar(data);
      }
      setFormOpen(false);
      setEditCliente(null);
      carregarClientes();
    } catch {
      // erro tratado pelo interceptor
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditCliente(cliente);
    setFormOpen(true);
  };

  const handleStatusChange = (cliente, novoStatus) => {
    setConfirmAction({
      cliente,
      novoStatus,
      message: `Deseja ${novoStatus === "BLOQUEADO" ? "bloquear" : novoStatus === "ATIVO" ? "ativar" : "inativar"} o cliente "${cliente.nome_razao_social}"?`,
    });
    setConfirmOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await clienteService.alterarStatus(confirmAction.cliente.id, confirmAction.novoStatus);
      setConfirmOpen(false);
      setConfirmAction(null);
      carregarClientes();
    } catch {
      // erro tratado pelo interceptor
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(0);
  };

  const columns = [
    { field: "nome_razao_social", headerName: "Nome / Razão Social" },
    { field: "cpf_cnpj", headerName: "CPF/CNPJ" },
    { field: "tipo_cliente", headerName: "Tipo" },
    { field: "email", headerName: "E-mail" },
    { field: "telefone", headerName: "Telefone" },
    {
      field: "limite_credito",
      headerName: "Limite",
      align: "right",
      renderCell: (row) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(row.limite_credito || 0),
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
          {canUpdate("clientes") && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => handleEdit(row)}>
                <MdEdit size={18} />
              </IconButton>
            </Tooltip>
          )}
          {canUpdate("clientes") && row.status === "ATIVO" && (
            <Tooltip title="Bloquear">
              <IconButton size="small" color="error" onClick={() => handleStatusChange(row, "BLOQUEADO")}>
                <MdBlock size={18} />
              </IconButton>
            </Tooltip>
          )}
          {canUpdate("clientes") && row.status === "BLOQUEADO" && (
            <Tooltip title="Ativar">
              <IconButton size="small" color="success" onClick={() => handleStatusChange(row, "ATIVO")}>
                <MdCheckCircle size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (error && !clientes.length) return <ErrorState message={error} onRetry={carregarClientes} />;

  return (
    <Box>
      <PageHeader
        title="Clientes"
        subtitle="Gerenciamento de clientes"
        actions={
          canCreate("clientes") && (
            <Button
              variant="contained"
              startIcon={<MdAdd size={20} />}
              onClick={() => { setEditCliente(null); setFormOpen(true); }}
            >
              Novo Cliente
            </Button>
          )
        }
      />

      <FilterToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Buscar por nome, CPF/CNPJ ou email..."
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(0); },
            options: [
              { value: "ATIVO", label: "Ativo" },
              { value: "BLOQUEADO", label: "Bloqueado" },
              { value: "INATIVO", label: "Inativo" },
            ],
          },
        ]}
        onClear={handleClearFilters}
      />

      <DataTable
        columns={columns}
        rows={clientes}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        emptyMessage="Nenhum cliente encontrado"
      />

      <ClienteFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCliente(null); }}
        onSubmit={handleSubmit}
        cliente={editCliente}
        loading={formLoading}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Alterar status do cliente"
        message={confirmAction?.message || ""}
        onConfirm={handleConfirmStatus}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        loading={confirmLoading}
      />
    </Box>
  );
}
