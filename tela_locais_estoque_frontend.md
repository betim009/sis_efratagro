# Tela de Locais de Estoque no Frontend

## Solução

Foi criada uma tela administrativa completa para gerenciar locais de estoque no ERP. A implementação usa React, Vite, Material UI e Axios centralizado, com separação entre página, service, dialog de formulário e tabela. A rota fica disponível em `/estoque/locais` e também foi adicionada ao menu lateral.

A tela consome diretamente as rotas do backend:

- `GET /api/estoque/locais`
- `POST /api/estoque/locais`
- `PUT /api/estoque/locais/:id`
- `PATCH /api/estoque/locais/:id/inativar`

## Estrutura de Arquivos

```text
frontend/src/
  pages/
    Estoque/
      LocaisEstoquePage.jsx
  components/
    estoque/
      LocalEstoqueFormDialog.jsx
      LocalEstoqueTable.jsx
    common/
      ConfirmDialog.jsx
      DataTable.jsx
      FilterToolbar.jsx
      PageHeader.jsx
      StatusBadge.jsx
  services/
    api.js
    localEstoqueService.js
  routes/
    AppRoutes.jsx
  components/
    layout/
      Sidebar.jsx
```

## Funcionalidades

- Listagem paginada de locais.
- Busca por nome, código ou descrição.
- Filtro por status `ATIVO` ou `INATIVO`.
- Criação via dialog.
- Edição via dialog preenchido.
- Inativação com confirmação.
- Feedback visual com Snackbar.
- Estados de loading, vazio e erro.
- Ações protegidas por permissões do módulo `estoque`.

## Estratégia de Loading, Vazio e Erro

A página usa `loading` para bloquear a tabela durante carregamentos, `DataTable` para exibir estado vazio quando não há registros e `ErrorState` quando a primeira carga falha sem dados. Erros de formulário são exibidos dentro do dialog, enquanto erros de inativação aparecem em Snackbar.

## Estratégia de Criar, Editar e Inativar

A criação e edição usam o mesmo `LocalEstoqueFormDialog`. Quando há `selectedLocal`, a submissão chama `localEstoqueService.atualizar`; quando não há, chama `localEstoqueService.criar`. A inativação usa `ConfirmDialog` para evitar ação acidental e chama `localEstoqueService.inativar`.

## Integração com Token e Autenticação

O service usa a instância `api` existente em `frontend/src/services/api.js`. Essa instância injeta automaticamente o token salvo no `tokenStorage` no header `Authorization: Bearer <token>`, então a tela já está preparada para consumir rotas protegidas.

## Observação de Integração com Backend Atual

O SRS da tela expõe nome, descrição e status. O backend atual também valida `codigo` e `tipo_local`; por isso, o service gera um código técnico a partir do nome quando ele não vem da edição e envia `tipo_local: "DEPOSITO"` como padrão. Isso mantém a UI simples sem quebrar a integração real.

## Código Completo

### `frontend/src/pages/Estoque/LocaisEstoquePage.jsx`

```jsx
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
```

### `frontend/src/components/estoque/LocalEstoqueFormDialog.jsx`

```jsx
import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

const initialForm = {
  nome: "",
  descricao: "",
  status: "ATIVO",
  codigo: "",
  tipo_local: "DEPOSITO",
  endereco_referencia: "",
};

const getInitialForm = (local) => ({
  nome: local?.nome || "",
  descricao: local?.descricao || "",
  status: local?.status || "ATIVO",
  codigo: local?.codigo || "",
  tipo_local: local?.tipo_local || "DEPOSITO",
  endereco_referencia: local?.endereco_referencia || "",
});

function LocalEstoqueFormDialogContent({
  open,
  local,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => (local ? getInitialForm(local) : initialForm));
  const [validationError, setValidationError] = useState(null);

  const isEdit = Boolean(local?.id);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.nome.trim()) {
      setValidationError("Informe o nome do local de estoque.");
      return;
    }

    setValidationError(null);
    onSubmit({
      ...form,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Editar local de estoque" : "Novo local de estoque"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} component="form" id="local-estoque-form" onSubmit={handleSubmit}>
          {(validationError || error) && (
            <Grid item xs={12}>
              <Alert severity="error">{validationError || error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              label="Nome"
              value={form.nome}
              onChange={handleChange("nome")}
              fullWidth
              required
              autoFocus
              disabled={loading}
              placeholder="Ex.: Depósito Central"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Descrição"
              value={form.descricao}
              onChange={handleChange("descricao")}
              fullWidth
              multiline
              minRows={3}
              disabled={loading}
              placeholder="Detalhes operacionais, endereço interno ou finalidade do local"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={handleChange("status")}
              fullWidth
              disabled={loading}
            >
              <MenuItem value="ATIVO">Ativo</MenuItem>
              <MenuItem value="INATIVO">Inativo</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" form="local-estoque-form" variant="contained" disabled={loading}>
          {loading ? "Salvando..." : "Salvar local"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LocalEstoqueFormDialog(props) {
  const key = `${props.open ? "open" : "closed"}-${props.local?.id || "new"}`;

  return <LocalEstoqueFormDialogContent key={key} {...props} />;
}
```

### `frontend/src/components/estoque/LocalEstoqueTable.jsx`

```jsx
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { MdBlock, MdEdit } from "react-icons/md";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";

export default function LocalEstoqueTable({
  rows,
  loading,
  page,
  rowsPerPage,
  total,
  canUpdate,
  onEdit,
  onInactivate,
  onPageChange,
  onRowsPerPageChange,
}) {
  const columns = [
    {
      field: "nome",
      headerName: "Local",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.nome}
          </Typography>
          {row.codigo && (
            <Typography variant="caption" color="text.secondary">
              Código: {row.codigo}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "descricao",
      headerName: "Descrição",
      renderCell: (row) => row.descricao || "—",
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: "actions",
      headerName: "Ações",
      align: "right",
      renderCell: (row) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          <Tooltip title="Editar local">
            <span>
              <IconButton size="small" onClick={() => onEdit(row)} disabled={!canUpdate}>
                <MdEdit size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.status === "INATIVO" ? "Local já inativo" : "Inativar local"}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onInactivate(row)}
                disabled={!canUpdate || row.status === "INATIVO"}
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
      emptyMessage="Nenhum local de estoque encontrado"
    />
  );
}
```

### `frontend/src/services/localEstoqueService.js`

```jsx
import api from "./api";

const BASE = "/estoque/locais";

const normalizeCode = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 30);

const buildPayload = (local) => ({
  nome: local.nome,
  codigo: local.codigo || normalizeCode(local.nome),
  descricao: local.descricao || null,
  tipo_local: local.tipo_local || "DEPOSITO",
  endereco_referencia: local.endereco_referencia || null,
  status: local.status || "ATIVO",
});

const localEstoqueService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  criar: async (local) => {
    const response = await api.post(BASE, buildPayload(local));
    return response.data;
  },

  atualizar: async (id, local) => {
    const response = await api.put(`${BASE}/${id}`, buildPayload(local));
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },
};

export default localEstoqueService;
```

### `frontend/src/routes/AppRoutes.jsx`

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import MainLayout from "../components/layout/MainLayout";
import MobileLayout from "../layouts/mobile/MobileLayout";
import ProtectedRoute from "./ProtectedRoute";
import Loading from "../components/common/Loading";

const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const ClientesPage = lazy(() => import("../pages/Clientes/ClientesPage"));
const FornecedoresPage = lazy(() => import("../pages/Fornecedores/FornecedoresPage"));
const ProdutosPage = lazy(() => import("../pages/Produtos/ProdutosPage"));
const EstoquePage = lazy(() => import("../pages/Estoque/EstoquePage"));
const LocaisEstoquePage = lazy(() => import("../pages/Estoque/LocaisEstoquePage"));
const VendasPage = lazy(() => import("../pages/Vendas/VendasPage"));
const FinanceiroPage = lazy(() => import("../pages/Financeiro/FinanceiroPage"));
const FrotaPage = lazy(() => import("../pages/Frota/FrotaPage"));
const EntregasPage = lazy(() => import("../pages/Entregas/EntregasPage"));
const RelatoriosPage = lazy(() => import("../pages/Relatorios/RelatoriosPage"));
const FretesPage = lazy(() => import("../pages/Fretes/FretesPage"));
const AuditoriaPage = lazy(() => import("../pages/Auditoria/AuditoriaPage"));
const NotificacoesPage = lazy(() => import("../pages/Notificacoes/NotificacoesPage"));
const AcessoNegadoPage = lazy(() => import("../pages/AcessoNegado/AcessoNegadoPage"));
const NotFoundPage = lazy(() => import("../pages/NotFound/NotFoundPage"));
const DashboardMobilePage = lazy(() => import("../mobile/pages/DashboardMobilePage"));
const ClientesMobilePage = lazy(() => import("../mobile/pages/ClientesMobilePage"));
const ProdutosMobilePage = lazy(() => import("../mobile/pages/ProdutosMobilePage"));
const EstoqueMobilePage = lazy(() => import("../mobile/pages/EstoqueMobilePage"));
const VendasMobilePage = lazy(() => import("../mobile/pages/VendasMobilePage"));
const FinanceiroMobilePage = lazy(() => import("../mobile/pages/FinanceiroMobilePage"));
const MenuMobilePage = lazy(() => import("../mobile/pages/MenuMobilePage"));

const adaptiveRoutes = [
  {
    path: "dashboard",
    desktopElement: <DashboardPage />,
    mobileElement: <DashboardMobilePage />,
    permission: "dashboard.read",
  },
  {
    path: "clientes",
    desktopElement: <ClientesPage />,
    mobileElement: <ClientesMobilePage />,
    permission: "clientes.read",
  },
  {
    path: "produtos",
    desktopElement: <ProdutosPage />,
    mobileElement: <ProdutosMobilePage />,
    permission: "produtos.read",
  },
  {
    path: "estoque",
    desktopElement: <EstoquePage />,
    mobileElement: <EstoqueMobilePage />,
    permission: "estoque.read",
  },
  {
    path: "vendas",
    desktopElement: <VendasPage />,
    mobileElement: <VendasMobilePage />,
    permission: "vendas.read",
  },
  {
    path: "financeiro",
    desktopElement: <FinanceiroPage />,
    mobileElement: <FinanceiroMobilePage />,
    permission: "financeiro.read",
  },
];

const desktopOnlyRoutes = [
  { path: "fornecedores", element: <FornecedoresPage />, permission: "fornecedores.read" },
  { path: "estoque/locais", element: <LocaisEstoquePage />, permission: "estoque.read" },
  { path: "frota", element: <FrotaPage />, permission: "frota.read" },
  { path: "entregas", element: <EntregasPage />, permission: "entregas.read" },
  { path: "relatorios", element: <RelatoriosPage />, permission: "relatorios.read" },
  { path: "fretes", element: <FretesPage />, permission: "fretes.read" },
  { path: "auditoria", element: <AuditoriaPage />, permission: "auditoria.read" },
  { path: "notificacoes", element: <NotificacoesPage />, permission: "notificacoes.read" },
];

export default function AppRoutes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const ActiveLayout = isMobile ? MobileLayout : MainLayout;

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <ActiveLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {adaptiveRoutes.map(({ path, desktopElement, mobileElement, permission }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute permission={permission}>
                {isMobile ? mobileElement : desktopElement}
              </ProtectedRoute>
            }
          />
        ))}

        {desktopOnlyRoutes.map(({ path, element, permission }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute permission={permission}>
                {element}
              </ProtectedRoute>
            }
          />
        ))}

        <Route
          path="menu"
          element={
            isMobile ? (
              <MenuMobilePage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route path="acesso-negado" element={<AcessoNegadoPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
```

### `frontend/src/components/layout/Sidebar.jsx`

```jsx
import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import {
  MdDashboard,
  MdPeople,
  MdStore,
  MdInventory,
  MdWarehouse,
  MdPointOfSale,
  MdAttachMoney,
  MdLocalShipping,
  MdDirectionsCar,
  MdAssessment,
  MdReceipt,
  MdSecurity,
  MdNotifications,
} from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { text: "Dashboard", icon: MdDashboard, path: "/dashboard", permission: "dashboard.read" },
  { divider: true, label: "Cadastros" },
  { text: "Clientes", icon: MdPeople, path: "/clientes", permission: "clientes.read" },
  { text: "Fornecedores", icon: MdStore, path: "/fornecedores", permission: "fornecedores.read" },
  { text: "Produtos", icon: MdInventory, path: "/produtos", permission: "produtos.read" },
  { divider: true, label: "Operações" },
  { text: "Estoque", icon: MdWarehouse, path: "/estoque", permission: "estoque.read" },
  { text: "Locais de Estoque", icon: MdWarehouse, path: "/estoque/locais", permission: "estoque.read" },
  { text: "Vendas", icon: MdPointOfSale, path: "/vendas", permission: "vendas.read" },
  { text: "Financeiro", icon: MdAttachMoney, path: "/financeiro", permission: "financeiro.read" },
  { divider: true, label: "Logística" },
  { text: "Frota", icon: MdDirectionsCar, path: "/frota", permission: "frota.read" },
  { text: "Entregas", icon: MdLocalShipping, path: "/entregas", permission: "entregas.read" },
  { text: "Fretes", icon: MdReceipt, path: "/fretes", permission: "fretes.read" },
  { divider: true, label: "Sistema" },
  { text: "Relatórios", icon: MdAssessment, path: "/relatorios", permission: "relatorios.read" },
  { text: "Auditoria", icon: MdSecurity, path: "/auditoria", permission: "auditoria.read" },
  { text: "Notificações", icon: MdNotifications, path: "/notificacoes", permission: "notificacoes.read" },
];

export default function Sidebar({ open, drawerWidth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1B3A1B",
          color: "#FFFFFF",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2.5,
          px: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#F9A825" }}>
          ERP Efrat Agro
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

      <List sx={{ px: 1, pt: 1 }}>
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <Box key={`divider-${index}`}>
                {index > 0 && (
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 0.5,
                    display: "block",
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontSize: "0.68rem",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          const isActive = location.pathname === item.path
            || location.pathname.startsWith(item.path + "/");

          const Icon = item.icon;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.3 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  backgroundColor: isActive
                    ? "rgba(249, 168, 37, 0.15)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? "rgba(249, 168, 37, 0.25)"
                      : "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#F9A825" : "rgba(255,255,255,0.7)",
                    minWidth: 40,
                  }}
                >
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#F9A825" : "rgba(255,255,255,0.9)",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
```

## Verificação

Comandos executados:

```bash
npm run build
npm run lint
git diff --check
```

Resultado: build passou, lint global passou e não há problemas de whitespace no diff.
