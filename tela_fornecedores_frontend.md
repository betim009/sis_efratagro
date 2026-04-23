# Tela de Fornecedores no Frontend

## Solução

A tela de fornecedores foi implementada como um módulo administrativo completo, integrado à API atual e preparado para crescimento. A página cobre listagem, cadastro, edição, inativação e visualização detalhada com abas para produtos vinculados e histórico de compras. A arquitetura separa página, tabela, formulário, dialog de detalhes e service de integração.

O fornecedor não foi tratado como cadastro banal. A tela deixa explícita sua participação em compras, estoque, custos e base financeira, inclusive na visualização de histórico e vínculos de produto.

## Estrutura de Arquivos

```text
frontend/src/
  pages/
    Fornecedores/
      FornecedoresPage.jsx
  components/
    fornecedores/
      FornecedorFormDialog.jsx
      FornecedorTable.jsx
      FornecedorDetailsDialog.jsx
      FornecedorProdutosTab.jsx
      FornecedorHistoricoComprasTab.jsx
    common/
      ConfirmDialog.jsx
      DataTable.jsx
      FilterToolbar.jsx
      FormDialog.jsx
      FormSection.jsx
      PageHeader.jsx
      StatusBadge.jsx
  services/
    fornecedorService.js
    api.js
```

## Estratégia da Tela

- Listagem principal em tabela com foco em razão social, nome fantasia, documento, contato e status.
- Cadastro e edição em dialog para manter o fluxo rápido e administrativo.
- Detalhes em dialog separado com tabs:
  - Dados gerais
  - Produtos vinculados
  - Histórico de compras
- Inativação com confirmação obrigatória.
- Bloqueio ficou preparado na arquitetura do service, mas não foi ativado na UI porque a API atual não expõe `PATCH /api/fornecedores/:id/status` nem aceita `BLOQUEADO` no backend.

## Integração com API

Rotas integradas de forma real:

- `GET /api/fornecedores`
- `GET /api/fornecedores/:id`
- `POST /api/fornecedores`
- `PUT /api/fornecedores/:id`
- `PATCH /api/fornecedores/:id/inativar`
- `GET /api/fornecedores/:id/produtos`
- `GET /api/fornecedores/:id/historico-compras`

Rotas preparadas para o futuro:

- `PATCH /api/fornecedores/:id/status` para bloqueio ou mudança ampla de status

## Estratégia de Loading, Vazio e Erro

- A listagem usa `loading` com `DataTable` e fallback para `ErrorState` quando a carga inicial falha sem dados.
- A aba de detalhes carrega fornecedor, produtos e histórico em paralelo e mostra `Loading` no dialog.
- Erros de formulário aparecem dentro do dialog.
- Erros operacionais aparecem em `Snackbar` e `Alert`.
- Tabela e tabs mostram estado vazio com `EmptyState` quando não há registros.

## Estratégia de Criar, Editar, Inativar e Bloquear

- Criar e editar reutilizam o mesmo `FornecedorFormDialog`.
- Antes de enviar, a UI valida razão social, CPF/CNPJ em formato básico e e-mail quando informado.
- O botão de inativação abre `ConfirmDialog` para prevenir ação acidental.
- O bloqueio não foi habilitado porque o backend atual não suporta esse fluxo. O service expõe `supportsStatusRoute()` para ativar a funcionalidade sem reestruturar a tela quando a API existir.

## Estratégia de Produtos Vinculados

A aba `FornecedorProdutosTab` consome `GET /api/fornecedores/:id/produtos` e mostra cards com código, nome, categoria, custo e indicação de fornecedor principal. Isso mantém a listagem principal enxuta e desloca a visão analítica para o dialog de detalhes.

## Estratégia de Histórico de Compras

A aba `FornecedorHistoricoComprasTab` consome `GET /api/fornecedores/:id/historico-compras` e mostra:

- métricas resumidas de compras
- lista das compras/entradas vinculadas
- valor total comprado
- quantidade comprada
- data da última compra

## Estratégia de Validação

- `razao_social`: obrigatória.
- `cnpj_cpf`: obrigatório, com validação básica por quantidade de dígitos antes do envio.
- `email`: opcional. Isso foi mantido porque a API atual permite e o SRS não exige obrigatoriedade rígida; quando informado, a UI valida formato.
- `status`: `ATIVO` ou `INATIVO` na integração real atual.

## Integração com Autenticação

O service usa a instância central `api`, que já injeta automaticamente `Authorization: Bearer <token>` a partir do `tokenStorage`. Não foi criada nenhuma lógica paralela de autenticação na tela.

## Código Completo

### `frontend/src/pages/Fornecedores/FornecedoresPage.jsx`

```jsx
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
```

### `frontend/src/components/fornecedores/FornecedorFormDialog.jsx`

```jsx
import { Alert, Grid, MenuItem, TextField } from "@mui/material";
import FormDialog from "../common/FormDialog";
import FormSection from "../common/FormSection";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function FornecedorFormDialog({
  open,
  fornecedor,
  loading = false,
  error = null,
  statusRouteEnabled = false,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(fornecedor?.id);

  const handleSubmit = () => {
    const form = document.getElementById("fornecedor-form");
    const formData = new FormData(form);

    onSubmit({
      razao_social: formData.get("razao_social"),
      nome_fantasia: formData.get("nome_fantasia") || null,
      tipo_pessoa: formData.get("tipo_pessoa") || "PJ",
      cnpj_cpf: formData.get("cnpj_cpf"),
      inscricao_estadual: formData.get("inscricao_estadual") || null,
      email: formData.get("email") || null,
      telefone: formData.get("telefone") || null,
      contato_responsavel: formData.get("contato_responsavel") || null,
      observacoes: formData.get("observacoes") || null,
      status: formData.get("status") || "ATIVO",
      endereco: {
        cep: formData.get("cep") || null,
        logradouro: formData.get("logradouro") || null,
        numero: formData.get("numero") || null,
        complemento: formData.get("complemento") || null,
        bairro: formData.get("bairro") || null,
        cidade: formData.get("cidade") || null,
        estado: formData.get("estado") || null,
      },
    });
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar fornecedor" : "Novo fornecedor"}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="fornecedor-form">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormSection title="Dados principais">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="razao_social"
                label="Razão social"
                defaultValue={fornecedor?.razao_social || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="tipo_pessoa"
                label="Tipo"
                defaultValue={fornecedor?.tipo_pessoa || "PJ"}
                select
                fullWidth
                size="small"
              >
                <MenuItem value="PJ">Pessoa jurídica</MenuItem>
                <MenuItem value="PF">Pessoa física</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="nome_fantasia"
                label="Nome fantasia"
                defaultValue={fornecedor?.nome_fantasia || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="cnpj_cpf"
                label="CNPJ / CPF"
                defaultValue={fornecedor?.cnpj_cpf || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="inscricao_estadual"
                label="Inscrição estadual"
                defaultValue={fornecedor?.inscricao_estadual || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="telefone"
                label="Telefone"
                defaultValue={fornecedor?.telefone || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="contato_responsavel"
                label="Contato responsável"
                defaultValue={fornecedor?.contato_responsavel || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="email"
                label="E-mail"
                type="email"
                defaultValue={fornecedor?.email || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="status"
                label="Status"
                defaultValue={fornecedor?.status || "ATIVO"}
                select
                fullWidth
                size="small"
              >
                <MenuItem value="ATIVO">Ativo</MenuItem>
                <MenuItem value="INATIVO">Inativo</MenuItem>
                {statusRouteEnabled && <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Endereço">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cep" label="CEP" defaultValue={fornecedor?.endereco?.cep || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField name="logradouro" label="Logradouro" defaultValue={fornecedor?.endereco?.logradouro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="numero" label="Número" defaultValue={fornecedor?.endereco?.numero || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="complemento" label="Complemento" defaultValue={fornecedor?.endereco?.complemento || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="bairro" label="Bairro" defaultValue={fornecedor?.endereco?.bairro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cidade" label="Cidade" defaultValue={fornecedor?.endereco?.cidade || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="estado" label="UF" defaultValue={fornecedor?.endereco?.estado || ""} select fullWidth size="small">
                <MenuItem value=""><em>—</em></MenuItem>
                {UFS.map((uf) => (
                  <MenuItem key={uf} value={uf}>
                    {uf}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Observações">
          <TextField
            name="observacoes"
            label="Observações"
            defaultValue={fornecedor?.observacoes || ""}
            fullWidth
            multiline
            rows={4}
            size="small"
          />
        </FormSection>
      </form>
    </FormDialog>
  );
}
```

### `frontend/src/components/fornecedores/FornecedorTable.jsx`

```jsx
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { MdBlock, MdEdit, MdInfo } from "react-icons/md";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";

export default function FornecedorTable({
  rows,
  loading,
  page,
  rowsPerPage,
  total,
  canUpdate,
  canInactivate,
  onPageChange,
  onRowsPerPageChange,
  onViewDetails,
  onEdit,
  onInactivate,
}) {
  const columns = [
    {
      field: "razao_social",
      headerName: "Fornecedor",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.razao_social}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.nome_fantasia || "Sem nome fantasia"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "cnpj_cpf",
      headerName: "CNPJ / CPF",
      renderCell: (row) => row.cnpj_cpf || "—",
    },
    {
      field: "contato",
      headerName: "Contato",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2">{row.contato_responsavel || "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.telefone || row.email || "Sem contato principal"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      align: "right",
      renderCell: (row) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          <Tooltip title="Ver detalhes">
            <IconButton size="small" onClick={() => onViewDetails(row)}>
              <MdInfo size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar fornecedor">
            <span>
              <IconButton size="small" onClick={() => onEdit(row)} disabled={!canUpdate}>
                <MdEdit size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.status === "INATIVO" ? "Fornecedor já inativo" : "Inativar fornecedor"}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onInactivate(row)}
                disabled={!canInactivate || row.status === "INATIVO"}
              >
                <MdBlock size={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      total={total}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="Nenhum fornecedor encontrado"
    />
  );
}
```

### `frontend/src/components/fornecedores/FornecedorDetailsDialog.jsx`

```jsx
import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import StatusBadge from "../common/StatusBadge";
import Loading from "../common/Loading";
import FornecedorProdutosTab from "./FornecedorProdutosTab";
import FornecedorHistoricoComprasTab from "./FornecedorHistoricoComprasTab";
import fornecedorService from "../../services/fornecedorService";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function DadosGeraisTab({ fornecedor }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      {[
        ["Razão social", fornecedor?.razao_social],
        ["Nome fantasia", fornecedor?.nome_fantasia],
        ["CNPJ / CPF", fornecedor?.cnpj_cpf],
        ["Inscrição estadual", fornecedor?.inscricao_estadual],
        ["Telefone", fornecedor?.telefone],
        ["E-mail", fornecedor?.email],
        ["Contato responsável", fornecedor?.contato_responsavel],
        ["Cidade", fornecedor?.endereco?.cidade],
        ["Estado", fornecedor?.endereco?.estado],
        ["CEP", fornecedor?.endereco?.cep],
        ["Logradouro", fornecedor?.endereco?.logradouro],
        ["Número", fornecedor?.endereco?.numero],
        ["Complemento", fornecedor?.endereco?.complemento],
        ["Bairro", fornecedor?.endereco?.bairro],
      ].map(([label, value]) => (
        <Box key={label}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2">{value || "—"}</Typography>
        </Box>
      ))}

      <Box sx={{ gridColumn: { md: "1 / -1" } }}>
        <Typography variant="caption" color="text.secondary">
          Observações
        </Typography>
        <Typography variant="body2">{fornecedor?.observacoes || "—"}</Typography>
      </Box>
    </Box>
  );
}

export default function FornecedorDetailsDialog({
  open,
  fornecedorId,
  onClose,
}) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fornecedor, setFornecedor] = useState(null);
  const [produtosData, setProdutosData] = useState(null);
  const [historicoData, setHistoricoData] = useState(null);

  useEffect(() => {
    if (!open || !fornecedorId) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [fornecedorResponse, produtosResponse, historicoResponse] = await Promise.all([
          fornecedorService.buscarPorId(fornecedorId),
          fornecedorService.listarProdutos(fornecedorId),
          fornecedorService.buscarHistoricoCompras(fornecedorId),
        ]);

        setFornecedor(fornecedorResponse.data || null);
        setProdutosData(produtosResponse.data || null);
        setHistoricoData(historicoResponse.data || null);
      } catch (err) {
        setError(getErrorMessage(err, "Erro ao carregar detalhes do fornecedor."));
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [fornecedorId, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {fornecedor?.razao_social || "Fornecedor"}
          </Typography>
          {fornecedor?.status && <StatusBadge status={fornecedor.status} />}
        </Box>
        <IconButton onClick={onClose}>
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Loading />
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
              <Tab label="Dados gerais" />
              <Tab label="Produtos vinculados" />
              <Tab label="Histórico de compras" />
            </Tabs>

            {tab === 0 && <DadosGeraisTab fornecedor={fornecedor} />}
            {tab === 1 && <FornecedorProdutosTab data={produtosData} />}
            {tab === 2 && <FornecedorHistoricoComprasTab data={historicoData} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### `frontend/src/components/fornecedores/FornecedorProdutosTab.jsx`

```jsx
import { Box, Grid, Paper, Typography } from "@mui/material";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import StatusBadge from "../common/StatusBadge";

export default function FornecedorProdutosTab({ loading = false, error = null, data }) {
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  if (!data?.items?.length) {
    return (
      <EmptyState
        title="Nenhum produto vinculado"
        description="Este fornecedor ainda não possui produtos vinculados na base atual."
      />
    );
  }

  return (
    <Grid container spacing={2}>
      {data.items.map((produto) => (
        <Grid key={produto.id} size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {produto.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Código: {produto.codigo}
                </Typography>
              </Box>
              <StatusBadge status={produto.status} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Categoria: {produto.categoria || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Preço de custo: {produto.preco_custo ?? "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vínculo principal: {produto.fornecedor_principal ? "Sim" : "Não"}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
```

### `frontend/src/components/fornecedores/FornecedorHistoricoComprasTab.jsx`

```jsx
import { Box, Grid, Paper, Typography } from "@mui/material";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export default function FornecedorHistoricoComprasTab({
  loading = false,
  error = null,
  data,
}) {
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Total de compras
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {data?.summary?.total_compras || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Quantidade comprada
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {Number(data?.summary?.quantidade_total_comprada || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Valor total
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatCurrency(data?.summary?.valor_total_compras)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Última compra
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatDateTime(data?.summary?.ultima_compra_em)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {data?.historico_compras?.length ? (
        <Grid container spacing={2}>
          {data.historico_compras.map((compra) => (
            <Grid key={compra.id} size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {compra.produto_nome}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Compra: {compra.compra_numero || compra.compra_public_id || compra.public_id || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantidade: {Number(compra.quantidade || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Custo unitário: {formatCurrency(compra.custo_unitario)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor total: {formatCurrency(compra.valor_total)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Local: {compra.local_destino_nome || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data: {formatDateTime(compra.data_movimentacao)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          title="Sem histórico de compras"
          description="Nenhuma compra vinculada a este fornecedor foi encontrada."
        />
      )}
    </Box>
  );
}
```

### `frontend/src/services/fornecedorService.js`

```jsx
import api from "./api";

const BASE = "/fornecedores";
const STATUS_ROUTE_AVAILABLE = false;

const fornecedorService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  criar: async (payload) => {
    const response = await api.post(BASE, payload);
    return response.data;
  },

  atualizar: async (id, payload) => {
    const response = await api.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },

  atualizarStatus: async (id, status) => {
    if (!STATUS_ROUTE_AVAILABLE) {
      throw new Error("A API atual ainda nao possui endpoint de alteracao ampla de status.");
    }

    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
  },

  listarProdutos: async (id) => {
    const response = await api.get(`${BASE}/${id}/produtos`);
    return response.data;
  },

  buscarHistoricoCompras: async (id) => {
    const response = await api.get(`${BASE}/${id}/historico-compras`);
    return response.data;
  },

  supportsStatusRoute: () => STATUS_ROUTE_AVAILABLE,
};

export default fornecedorService;
```

## Verificação

Comandos executados:

```bash
npm run lint
npm run build
```

Ambos passaram.
