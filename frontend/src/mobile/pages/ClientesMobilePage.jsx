import { useCallback, useEffect, useState } from "react";
import { Chip, IconButton, Stack } from "@mui/material";
import { MdBlock, MdCheckCircle, MdEdit, MdFilterList, MdPersonAdd } from "react-icons/md";
import ClienteFormDialog from "../../components/clientes/ClienteFormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import clienteService from "../../services/clienteService";
import { usePermission } from "../../hooks/usePermission";
import MobileActionBar from "../components/MobileActionBar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import MobileListItem from "../components/MobileListItem";
import MobilePageShell from "../components/MobilePageShell";
import MobileSection from "../components/MobileSection";
import { MobileEmptyState, MobileErrorState, MobileLoadingState } from "../components/MobileStateSection";
import { formatCurrency } from "../utils/formatters";

export default function ClientesMobilePage() {
  const { canCreate, canUpdate } = usePermission();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editCliente, setEditCliente] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clienteService.listar({
        page: 1,
        limit: 20,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setClientes(response.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

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
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmAction) return;
    try {
      await clienteService.alterarStatus(confirmAction.cliente.id, confirmAction.novoStatus);
      setConfirmOpen(false);
      setConfirmAction(null);
      carregarClientes();
    } catch {
      // interceptor global
    }
  };

  if (loading) return <MobileLoadingState cards={4} />;
  if (error && !clientes.length) return <MobileErrorState message={error} onRetry={carregarClientes} />;

  return (
    <MobilePageShell title="Clientes" subtitle="Lista em cards com filtros sob demanda">
      <MobileActionBar
        primaryAction={
          canCreate("clientes")
            ? {
                label: "Novo cliente",
                icon: <MdPersonAdd size={18} />,
                onClick: () => {
                  setEditCliente(null);
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

      <MobileSection title="Resultado" subtitle={`${clientes.length} cliente(s) carregado(s)`}>
        <Stack spacing={1.5}>
          {clientes.length ? (
            clientes.map((cliente) => (
              <MobileListItem
                key={cliente.id}
                title={cliente.nome_razao_social}
                subtitle={cliente.email || cliente.cpf_cnpj || "Sem contato cadastrado"}
                meta={cliente.telefone || "—"}
                chips={[
                  { label: cliente.status, color: cliente.status === "ATIVO" ? "success" : cliente.status === "BLOQUEADO" ? "error" : "default" },
                  { label: cliente.tipo_cliente || "Cliente", variant: "outlined" },
                ]}
                details={[
                  { label: "CPF/CNPJ", value: cliente.cpf_cnpj || "—" },
                  { label: "Limite", value: formatCurrency(cliente.limite_credito), emphasis: true },
                ]}
                actions={[
                  ...(canUpdate("clientes")
                    ? [
                        {
                          label: "Editar",
                          icon: <MdEdit size={20} />,
                          onClick: () => {
                            setEditCliente(cliente);
                            setFormOpen(true);
                          },
                        },
                      ]
                    : []),
                  ...(canUpdate("clientes") && cliente.status === "ATIVO"
                    ? [
                        {
                          label: "Bloquear",
                          icon: <MdBlock size={20} />,
                          color: "error",
                          onClick: () => {
                            setConfirmAction({ cliente, novoStatus: "BLOQUEADO" });
                            setConfirmOpen(true);
                          },
                        },
                      ]
                    : []),
                  ...(canUpdate("clientes") && cliente.status === "BLOQUEADO"
                    ? [
                        {
                          label: "Ativar",
                          icon: <MdCheckCircle size={20} />,
                          color: "success",
                          onClick: () => {
                            setConfirmAction({ cliente, novoStatus: "ATIVO" });
                            setConfirmOpen(true);
                          },
                        },
                      ]
                    : []),
                ]}
              />
            ))
          ) : (
            <MobileEmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros ou cadastre um novo cliente." />
          )}
        </Stack>
      </MobileSection>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nome, CPF/CNPJ ou e-mail"
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "ATIVO", label: "Ativo" },
              { value: "BLOQUEADO", label: "Bloqueado" },
              { value: "INATIVO", label: "Inativo" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setStatusFilter("");
        }}
      />

      <ClienteFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditCliente(null);
        }}
        onSubmit={handleSubmit}
        cliente={editCliente}
        loading={formLoading}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Alterar status"
        message={`Deseja alterar o status de "${confirmAction?.cliente?.nome_razao_social}" para ${confirmAction?.novoStatus}?`}
        onConfirm={handleStatusChange}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
      />
    </MobilePageShell>
  );
}
