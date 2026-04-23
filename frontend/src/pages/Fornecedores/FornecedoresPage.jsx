import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Snackbar } from "@mui/material";
import { MdAdd, MdStore } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import FornecedorTable from "../../components/fornecedores/FornecedorTable";
import FornecedorFormDialog from "../../components/fornecedores/FornecedorFormDialog";
import FornecedorDetailsDialog from "../../components/fornecedores/FornecedorDetailsDialog";
import fornecedorService from "../../services/fornecedorService";
import { usePermission } from "../../hooks/usePermission";

const DOCUMENT_DIGITS = /\D/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const normalizeDocument = (value) => String(value || "").replace(DOCUMENT_DIGITS, "");

export default function FornecedoresPage() {
  const { canCreate, canUpdate } = usePermission();
  const statusRouteEnabled = fornecedorService.supportsStatusRoute();

  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsFornecedorId, setDetailsFornecedorId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fornecedorToInactivate, setFornecedorToInactivate] = useState(null);
  const [inactivating, setInactivating] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const loadFornecedores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (search) params.search = search;
      if (status) params.status = status;

      const response = await fornecedorService.listar(params);
      setFornecedores(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao carregar fornecedores."));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFornecedores();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadFornecedores]);

  const validateFornecedorPayload = (payload) => {
    if (!payload.razao_social?.trim()) {
      return "Informe a razão social do fornecedor.";
    }

    const normalizedDocument = normalizeDocument(payload.cnpj_cpf);

    if (![11, 14].includes(normalizedDocument.length)) {
      return "Informe um CPF ou CNPJ válido no formato básico.";
    }

    if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
      return "Informe um e-mail válido.";
    }

    return null;
  };

  const openCreateDialog = () => {
    setSelectedFornecedor(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setFormError(null);
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (saving) return;
    setFormOpen(false);
    setSelectedFornecedor(null);
    setFormError(null);
  };

  const handleSubmit = async (payload) => {
    const validationError = validateFornecedorPayload(payload);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (selectedFornecedor?.id) {
        await fornecedorService.atualizar(selectedFornecedor.id, payload);
        setFeedback({ type: "success", message: "Fornecedor atualizado com sucesso." });
      } else {
        await fornecedorService.criar(payload);
        setFeedback({ type: "success", message: "Fornecedor cadastrado com sucesso." });
      }

      setFormOpen(false);
      setSelectedFornecedor(null);
      await loadFornecedores();
    } catch (err) {
      setFormError(getErrorMessage(err, "Erro ao salvar fornecedor."));
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (fornecedor) => {
    setDetailsFornecedorId(fornecedor.id);
    setDetailsOpen(true);
  };

  const requestInactivate = (fornecedor) => {
    setFornecedorToInactivate(fornecedor);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (inactivating) return;
    setConfirmOpen(false);
    setFornecedorToInactivate(null);
  };

  const confirmInactivate = async () => {
    if (!fornecedorToInactivate?.id) return;

    setInactivating(true);

    try {
      await fornecedorService.inativar(fornecedorToInactivate.id);
      setFeedback({ type: "success", message: "Fornecedor inativado com sucesso." });
      setConfirmOpen(false);
      setFornecedorToInactivate(null);
      await loadFornecedores();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "Erro ao inativar fornecedor."),
      });
    } finally {
      setInactivating(false);
    }
  };

  if (error && !fornecedores.length) {
    return <ErrorState message={error} onRetry={loadFornecedores} />;
  }

  return (
    <Box>
      <PageHeader
        title="Fornecedores"
        subtitle="Administração de fornecedores com integração para compras, estoque, custos e base financeira"
        actions={
          canCreate("fornecedores") && (
            <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={openCreateDialog}>
              Novo fornecedor
            </Button>
          )
        }
      />

      {!statusRouteEnabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          O bloqueio de fornecedor permanece preparado na arquitetura, mas a API atual ainda não expõe um endpoint de alteração ampla de status.
        </Alert>
      )}

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
        searchPlaceholder="Buscar por razão social, nome fantasia, documento ou contato..."
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
        onClear={() => {
          setSearch("");
          setStatus("");
          setPage(0);
        }}
        actions={
          <Button
            size="small"
            variant="outlined"
            startIcon={<MdStore size={18} />}
            onClick={loadFornecedores}
            disabled={loading}
          >
            Atualizar
          </Button>
        }
      />

      <FornecedorTable
        rows={fornecedores}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        canUpdate={canUpdate("fornecedores")}
        canInactivate={canUpdate("fornecedores")}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        onViewDetails={openDetails}
        onEdit={openEditDialog}
        onInactivate={requestInactivate}
      />

      <FornecedorFormDialog
        open={formOpen}
        fornecedor={selectedFornecedor}
        loading={saving}
        error={formError}
        statusRouteEnabled={statusRouteEnabled}
        onClose={closeFormDialog}
        onSubmit={handleSubmit}
      />

      <FornecedorDetailsDialog
        open={detailsOpen}
        fornecedorId={detailsFornecedorId}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsFornecedorId(null);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Inativar fornecedor"
        message={`Deseja realmente inativar o fornecedor "${fornecedorToInactivate?.razao_social || ""}"? Ele deixará de poder ser usado em novas compras.`}
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
