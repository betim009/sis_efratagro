import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Snackbar } from "@mui/material";
import { MdAdd, MdWarehouse } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LocalEstoqueFormDialog from "../../components/estoque/LocalEstoqueFormDialog";
import LocalEstoqueTable from "../../components/estoque/LocalEstoqueTable";
import { usePermission } from "../../hooks/usePermission";
import localEstoqueService from "../../services/localEstoqueService";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function LocaisEstoquePage() {
  const { canCreate, canUpdate } = usePermission();

  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localToInactivate, setLocalToInactivate] = useState(null);
  const [inactivating, setInactivating] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const loadLocais = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        include_inativos: true,
      };

      if (search) params.search = search;
      if (status) params.status = status;

      const response = await localEstoqueService.listar(params);
      setLocais(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao carregar locais de estoque."));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLocais();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadLocais]);

  const openCreateDialog = () => {
    setSelectedLocal(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (local) => {
    setSelectedLocal(local);
    setFormError(null);
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (saving) return;
    setFormOpen(false);
    setSelectedLocal(null);
    setFormError(null);
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    setFormError(null);

    try {
      if (selectedLocal?.id) {
        await localEstoqueService.atualizar(selectedLocal.id, {
          ...selectedLocal,
          ...payload,
        });
        setFeedback({ type: "success", message: "Local de estoque atualizado com sucesso." });
      } else {
        await localEstoqueService.criar(payload);
        setFeedback({ type: "success", message: "Local de estoque criado com sucesso." });
      }

      setFormOpen(false);
      setSelectedLocal(null);
      await loadLocais();
    } catch (err) {
      setFormError(getErrorMessage(err, "Erro ao salvar local de estoque."));
    } finally {
      setSaving(false);
    }
  };

  const requestInactivate = (local) => {
    setLocalToInactivate(local);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (inactivating) return;
    setConfirmOpen(false);
    setLocalToInactivate(null);
  };

  const confirmInactivate = async () => {
    if (!localToInactivate?.id) return;

    setInactivating(true);

    try {
      await localEstoqueService.inativar(localToInactivate.id);
      setFeedback({ type: "success", message: "Local de estoque inativado com sucesso." });
      setConfirmOpen(false);
      setLocalToInactivate(null);
      await loadLocais();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "Erro ao inativar local de estoque."),
      });
    } finally {
      setInactivating(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(0);
  };

  if (error && !locais.length) {
    return <ErrorState message={error} onRetry={loadLocais} />;
  }

  return (
    <Box>
      <PageHeader
        title="Locais de Estoque"
        subtitle="Administre galpões, depósitos, armazéns e filiais usados nas movimentações"
        actions={
          canCreate("estoque") && (
            <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={openCreateDialog}>
              Novo local
            </Button>
          )
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FilterToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder="Buscar por nome, código ou descrição..."
        filters={[
          {
            name: "status",
            label: "Status",
            value: status,
            onChange: (value) => {
              setStatus(value);
              setPage(0);
            },
            options: [
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
            ],
          },
        ]}
        onClear={clearFilters}
        actions={
          <Button
            size="small"
            variant="outlined"
            startIcon={<MdWarehouse size={18} />}
            onClick={loadLocais}
            disabled={loading}
          >
            Atualizar
          </Button>
        }
      />

      <LocalEstoqueTable
        rows={locais}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        canUpdate={canUpdate("estoque")}
        onEdit={openEditDialog}
        onInactivate={requestInactivate}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
      />

      <LocalEstoqueFormDialog
        open={formOpen}
        local={selectedLocal}
        loading={saving}
        error={formError}
        onClose={closeFormDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Inativar local de estoque"
        message={`Deseja realmente inativar o local "${localToInactivate?.nome || ""}"? Ele deixará de ficar disponível para novas movimentações.`}
        confirmText="Inativar"
        confirmColor="error"
        loading={inactivating}
        onCancel={closeConfirm}
        onConfirm={confirmInactivate}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={5000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {feedback && (
          <Alert severity={feedback.type} variant="filled" onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}
