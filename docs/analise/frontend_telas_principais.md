# Telas Principais do Frontend — ERP Efrat Agro

## 1. Estratégia de Organização

### Princípios

| Princípio | Implementação |
|-----------|--------------|
| **Separação por responsabilidade** | Page orquestra → componentes exibem → services comunicam |
| **Componentes reutilizáveis** | FilterToolbar, FormDialog, FormSection, AlertBlock, ErrorState compartilhados |
| **Componentes específicos** | Cada módulo tem seus dialogs em `components/<modulo>/` |
| **Services isolados** | Um service por módulo, preparado para os endpoints reais do backend |
| **Estados visuais** | Loading, empty e error tratados em todas as telas |
| **Permissões** | Botões e ações condicionais via `usePermission` |
| **Confirmação em ações destrutivas** | `ConfirmDialog` para cancelar vendas, inativar, alterar status |

### Fluxo de dados

```
Page → carrega dados via Service → exibe em DataTable
     → abre FormDialog → submete via Service → recarrega dados
     → estados: loading (Loading), vazio (EmptyState), erro (ErrorState)
```

---

## 2. Estrutura de Pastas

```
frontend/src/
├── services/
│   ├── api.js                     (existente)
│   ├── dashboardService.js        (expandido)
│   ├── clienteService.js          (novo)
│   ├── produtoService.js          (novo)
│   ├── estoqueService.js          (novo)
│   ├── vendaService.js            (novo)
│   └── financeiroService.js       (novo)
├── components/
│   ├── common/
│   │   ├── DataTable.jsx          (existente)
│   │   ├── StatusBadge.jsx        (atualizado)
│   │   ├── PageHeader.jsx         (existente)
│   │   ├── StatCard.jsx           (existente)
│   │   ├── Loading.jsx            (existente)
│   │   ├── EmptyState.jsx         (existente)
│   │   ├── ConfirmDialog.jsx      (existente)
│   │   ├── FilterToolbar.jsx      (novo)
│   │   ├── FormDialog.jsx         (novo)
│   │   ├── FormSection.jsx        (novo)
│   │   ├── ErrorState.jsx         (novo)
│   │   └── AlertBlock.jsx         (novo)
│   ├── clientes/
│   │   └── ClienteFormDialog.jsx  (novo)
│   ├── produtos/
│   │   └── ProdutoFormDialog.jsx  (novo)
│   ├── estoque/
│   │   └── MovimentacaoDialog.jsx (novo)
│   ├── vendas/
│   │   └── VendaFormDialog.jsx    (novo)
│   └── financeiro/
│       └── PagamentoDialog.jsx    (novo)
└── pages/
    ├── Dashboard/DashboardPage.jsx (reescrito)
    ├── Clientes/ClientesPage.jsx   (reescrito)
    ├── Produtos/ProdutosPage.jsx   (reescrito)
    ├── Estoque/EstoquePage.jsx     (reescrito)
    ├── Vendas/VendasPage.jsx       (reescrito)
    └── Financeiro/FinanceiroPage.jsx (reescrito)
```

---

## 3. Services de Integração

### 3.1 `src/services/dashboardService.js` (expandido)

```javascript
import api from "./api";

const dashboardService = {
  getResumo: async () => {
    const response = await api.get("/dashboard/resumo");
    return response.data;
  },

  getFinanceiro: async () => {
    const response = await api.get("/dashboard/financeiro");
    return response.data;
  },

  getEstoque: async () => {
    const response = await api.get("/dashboard/estoque");
    return response.data;
  },

  getAlertas: async () => {
    const response = await api.get("/dashboard/alertas");
    return response.data;
  },

  getSeriesVendas: async (params = {}) => {
    const response = await api.get("/dashboard/series/vendas", { params });
    return response.data;
  },

  getVendas: async () => {
    const response = await api.get("/dashboard/vendas");
    return response.data;
  },

  getVendasFuturas: async () => {
    const response = await api.get("/dashboard/vendas-futuras");
    return response.data;
  },

  getCompleto: async () => {
    const response = await api.get("/dashboard/completo");
    return response.data;
  },
};

export default dashboardService;
```

### 3.2 `src/services/clienteService.js`

```javascript
import api from "./api";

const BASE = "/clientes";

const clienteService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  criar: async (data) => {
    const response = await api.post(BASE, data);
    return response.data;
  },

  atualizar: async (id, data) => {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  },

  alterarStatus: async (id, status) => {
    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },

  getHistoricoCompras: async (id) => {
    const response = await api.get(`${BASE}/${id}/historico-compras`);
    return response.data;
  },

  getDebitosEmAberto: async (id) => {
    const response = await api.get(`${BASE}/${id}/debitos-em-aberto`);
    return response.data;
  },
};

export default clienteService;
```

### 3.3 `src/services/produtoService.js`

```javascript
import api from "./api";

const BASE = "/produtos";

const produtoService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  criar: async (data) => {
    const response = await api.post(BASE, data);
    return response.data;
  },

  atualizar: async (id, data) => {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },

  listarPorStatus: async (status, params = {}) => {
    const response = await api.get(`${BASE}/status/${status}`, { params });
    return response.data;
  },

  listarPorCategoria: async (categoria, params = {}) => {
    const response = await api.get(`${BASE}/categoria/${categoria}`, { params });
    return response.data;
  },

  getSaldoEstoque: async (id) => {
    const response = await api.get(`${BASE}/${id}/saldo-estoque`);
    return response.data;
  },

  getAlertasEstoqueMinimo: async () => {
    const response = await api.get(`${BASE}/alertas/estoque-minimo`);
    return response.data;
  },
};

export default produtoService;
```

### 3.4 `src/services/estoqueService.js`

```javascript
import api from "./api";

const BASE = "/estoque";

const estoqueService = {
  listarSaldos: async (params = {}) => {
    const response = await api.get(`${BASE}/saldos`, { params });
    return response.data;
  },

  listarMovimentacoes: async (params = {}) => {
    const response = await api.get(`${BASE}/movimentacoes`, { params });
    return response.data;
  },

  registrarEntrada: async (data) => {
    const response = await api.post(`${BASE}/movimentacoes/entrada`, data);
    return response.data;
  },

  registrarSaida: async (data) => {
    const response = await api.post(`${BASE}/movimentacoes/saida`, data);
    return response.data;
  },

  registrarTransferencia: async (data) => {
    const response = await api.post(`${BASE}/movimentacoes/transferencia`, data);
    return response.data;
  },

  listarLocais: async () => {
    const response = await api.get(`${BASE}/locais`);
    return response.data;
  },

  getAlertasBaixoEstoque: async () => {
    const response = await api.get(`${BASE}/alertas/baixo-estoque`);
    return response.data;
  },
};

export default estoqueService;
```

### 3.5 `src/services/vendaService.js`

```javascript
import api from "./api";

const BASE = "/vendas";

const vendaService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  criar: async (data) => {
    const response = await api.post(BASE, data);
    return response.data;
  },

  atualizar: async (id, data) => {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  },

  alterarStatus: async (id, status) => {
    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
  },

  cancelar: async (id, motivo) => {
    const response = await api.patch(`${BASE}/${id}/cancelar`, { motivo });
    return response.data;
  },

  getItens: async (id) => {
    const response = await api.get(`${BASE}/${id}/itens`);
    return response.data;
  },
};

export default vendaService;
```

### 3.6 `src/services/financeiroService.js`

```javascript
import api from "./api";

const BASE = "/financeiro";

const financeiroService = {
  listarDuplicatas: async (params = {}) => {
    const response = await api.get(`${BASE}/duplicatas`, { params });
    return response.data;
  },

  buscarDuplicata: async (id) => {
    const response = await api.get(`${BASE}/duplicatas/${id}`);
    return response.data;
  },

  listarPorStatus: async (status, params = {}) => {
    const response = await api.get(`${BASE}/duplicatas/status/${status}`, { params });
    return response.data;
  },

  listarPorCliente: async (clienteId, params = {}) => {
    const response = await api.get(`${BASE}/duplicatas/cliente/${clienteId}`, { params });
    return response.data;
  },

  gerarDuplicata: async (data) => {
    const response = await api.post(`${BASE}/duplicatas/gerar`, data);
    return response.data;
  },

  gerarParcelas: async (data) => {
    const response = await api.post(`${BASE}/duplicatas/gerar-parcelas`, data);
    return response.data;
  },

  registrarPagamento: async (duplicataId, data) => {
    const response = await api.post(`${BASE}/duplicatas/${duplicataId}/pagamentos`, data);
    return response.data;
  },

  listarPagamentos: async (duplicataId) => {
    const response = await api.get(`${BASE}/duplicatas/${duplicataId}/pagamentos`);
    return response.data;
  },

  getAlertasVencidas: async () => {
    const response = await api.get(`${BASE}/duplicatas/alertas/vencidas`);
    return response.data;
  },

  getAlertasVencendo: async () => {
    const response = await api.get(`${BASE}/duplicatas/alertas/vencendo`);
    return response.data;
  },

  getResumo: async () => {
    const response = await api.get(`${BASE}/resumo`);
    return response.data;
  },
};

export default financeiroService;
```

---

## 4. Componentes Reutilizáveis

### 4.1 `src/components/common/FilterToolbar.jsx`

```jsx
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
} from "@mui/material";
import { MdSearch, MdFilterList, MdClear } from "react-icons/md";

export default function FilterToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  onClear,
  actions,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        mb: 3,
        alignItems: "center",
      }}
    >
      {onSearchChange && (
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={20} />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {filters.map((filter) => (
        <TextField
          key={filter.name}
          select
          size="small"
          label={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          sx={{ minWidth: filter.minWidth || 160 }}
        >
          <MenuItem value="">
            <em>Todos</em>
          </MenuItem>
          {filter.options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      ))}

      {onClear && (
        <Button
          size="small"
          startIcon={<MdClear size={18} />}
          onClick={onClear}
          sx={{ color: "text.secondary" }}
        >
          Limpar
        </Button>
      )}

      {actions && (
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>{actions}</Box>
      )}
    </Box>
  );
}
```

### 4.2 `src/components/common/FormDialog.jsx`

```jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import { MdClose } from "react-icons/md";

export default function FormDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Salvar",
  cancelText = "Cancelar",
  loading = false,
  maxWidth = "sm",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {title}
        <IconButton onClick={onClose} disabled={loading} size="small">
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Salvando..." : submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 4.3 `src/components/common/FormSection.jsx`

```jsx
import { Box, Typography } from "@mui/material";

export default function FormSection({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </Box>
    </Box>
  );
}
```

### 4.4 `src/components/common/ErrorState.jsx`

```jsx
import { Box, Typography, Button } from "@mui/material";
import { MdErrorOutline } from "react-icons/md";

export default function ErrorState({
  message = "Ocorreu um erro ao carregar os dados.",
  onRetry,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
      }}
    >
      <MdErrorOutline size={56} color="#D32F2F" />
      <Typography variant="h6" color="error" sx={{ fontWeight: 500 }}>
        Erro
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 400 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 1 }}>
          Tentar novamente
        </Button>
      )}
    </Box>
  );
}
```

### 4.5 `src/components/common/AlertBlock.jsx`

```jsx
import { Card, CardContent, Box, Typography, Chip } from "@mui/material";
import { MdWarning, MdError, MdInfo } from "react-icons/md";

const severityConfig = {
  warning: { icon: MdWarning, color: "#ED6C02", bg: "#FFF3E0", chipColor: "warning" },
  error: { icon: MdError, color: "#D32F2F", bg: "#FFEBEE", chipColor: "error" },
  info: { icon: MdInfo, color: "#0288D1", bg: "#E3F2FD", chipColor: "info" },
};

export default function AlertBlock({ title, items = [], severity = "warning" }) {
  const config = severityConfig[severity] || severityConfig.warning;
  const Icon = config.icon;

  if (!items.length) return null;

  return (
    <Card sx={{ borderLeft: `4px solid ${config.color}`, backgroundColor: config.bg }}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Icon size={20} color={config.color} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip label={items.length} size="small" color={config.chipColor} sx={{ ml: "auto", height: 22 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {items.slice(0, 5).map((item, i) => (
            <Typography key={i} variant="body2" color="text.secondary">
              • {item}
            </Typography>
          ))}
          {items.length > 5 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              ... e mais {items.length - 5} alerta(s)
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
```

### 4.6 `src/components/common/StatusBadge.jsx` (atualizado)

```jsx
import { Chip } from "@mui/material";

const statusConfig = {
  ATIVO: { label: "Ativo", color: "success" },
  INATIVO: { label: "Inativo", color: "default" },
  BLOQUEADO: { label: "Bloqueado", color: "error" },
  PENDENTE: { label: "Pendente", color: "warning" },
  CONCLUIDO: { label: "Concluído", color: "success" },
  CANCELADO: { label: "Cancelado", color: "error" },
  CANCELADA: { label: "Cancelada", color: "error" },
  EM_ANDAMENTO: { label: "Em andamento", color: "info" },
  NAO_LIDA: { label: "Não lida", color: "warning" },
  LIDA: { label: "Lida", color: "default" },
  ARQUIVADA: { label: "Arquivada", color: "default" },
  BAIXA: { label: "Baixa", color: "default" },
  MEDIA: { label: "Média", color: "info" },
  ALTA: { label: "Alta", color: "warning" },
  CRITICA: { label: "Crítica", color: "error" },
  // Financeiro
  EM_ABERTO: { label: "Em aberto", color: "warning" },
  PAGO: { label: "Pago", color: "success" },
  PAGO_PARCIALMENTE: { label: "Pago parcial", color: "info" },
  VENCIDO: { label: "Vencido", color: "error" },
  // Vendas
  CONFIRMADA: { label: "Confirmada", color: "info" },
  FATURADA: { label: "Faturada", color: "success" },
  // Tipos de venda
  NORMAL: { label: "Normal", color: "default" },
  FUTURA: { label: "Futura", color: "info" },
  DIRETA: { label: "Direta", color: "success" },
};

export default function StatusBadge({ status, size = "small" }) {
  const config = statusConfig[status] || {
    label: status || "—",
    color: "default",
  };

  return <Chip label={config.label} color={config.color} size={size} />;
}
```

---

## 5. Componentes Específicos por Módulo

### 5.1 `src/components/clientes/ClienteFormDialog.jsx`

```jsx
import { Grid, TextField, MenuItem } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function ClienteFormDialog({ open, onClose, onSubmit, cliente, loading }) {
  const isEdit = !!cliente?.id;

  const handleSubmit = () => {
    const form = document.getElementById("cliente-form");
    const formData = new FormData(form);

    const data = {
      nome_razao_social: formData.get("nome_razao_social"),
      cpf_cnpj: formData.get("cpf_cnpj"),
      email: formData.get("email") || null,
      telefone: formData.get("telefone") || null,
      tipo_cliente: formData.get("tipo_cliente") || "PF",
      limite_credito: parseFloat(formData.get("limite_credito")) || 0,
      observacoes: formData.get("observacoes") || null,
      endereco: {
        cep: formData.get("cep") || null,
        logradouro: formData.get("logradouro") || null,
        numero: formData.get("numero") || null,
        complemento: formData.get("complemento") || null,
        bairro: formData.get("bairro") || null,
        cidade: formData.get("cidade") || null,
        estado: formData.get("estado") || null,
      },
    };

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="cliente-form">
        <FormSection title="Dados principais">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="nome_razao_social"
                label="Nome / Razão Social"
                defaultValue={cliente?.nome_razao_social || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="tipo_cliente"
                label="Tipo"
                defaultValue={cliente?.tipo_cliente || "PF"}
                select
                fullWidth
                size="small"
              >
                <MenuItem value="PF">Pessoa Física</MenuItem>
                <MenuItem value="PJ">Pessoa Jurídica</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="cpf_cnpj"
                label="CPF / CNPJ"
                defaultValue={cliente?.cpf_cnpj || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="email"
                label="E-mail"
                type="email"
                defaultValue={cliente?.email || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="telefone"
                label="Telefone"
                defaultValue={cliente?.telefone || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="limite_credito"
                label="Limite de crédito"
                type="number"
                defaultValue={cliente?.limite_credito || 0}
                fullWidth
                size="small"
                slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Endereço">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cep" label="CEP" defaultValue={cliente?.endereco?.cep || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField name="logradouro" label="Logradouro" defaultValue={cliente?.endereco?.logradouro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="numero" label="Número" defaultValue={cliente?.endereco?.numero || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="complemento" label="Complemento" defaultValue={cliente?.endereco?.complemento || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="bairro" label="Bairro" defaultValue={cliente?.endereco?.bairro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cidade" label="Cidade" defaultValue={cliente?.endereco?.cidade || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="estado" label="UF" defaultValue={cliente?.endereco?.estado || ""} select fullWidth size="small">
                <MenuItem value=""><em>—</em></MenuItem>
                {UFS.map((uf) => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Observações">
          <TextField
            name="observacoes"
            label="Observações"
            defaultValue={cliente?.observacoes || ""}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        </FormSection>
      </form>
    </FormDialog>
  );
}
```

### 5.2 `src/components/produtos/ProdutoFormDialog.jsx`

```jsx
import { Grid, TextField, MenuItem, FormControlLabel, Switch } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const UNIDADES = ["UN", "KG", "LT", "CX", "PCT", "SC", "TON", "ML", "M", "M2", "M3"];

export default function ProdutoFormDialog({ open, onClose, onSubmit, produto, loading }) {
  const isEdit = !!produto?.id;

  const handleSubmit = () => {
    const form = document.getElementById("produto-form");
    const formData = new FormData(form);

    const data = {
      codigo: formData.get("codigo"),
      nome: formData.get("nome"),
      descricao: formData.get("descricao") || null,
      unidade_medida: formData.get("unidade_medida") || null,
      categoria: formData.get("categoria") || null,
      preco_custo: parseFloat(formData.get("preco_custo")) || 0,
      preco_venda: parseFloat(formData.get("preco_venda")) || 0,
      peso: parseFloat(formData.get("peso")) || 0,
      codigo_barras: formData.get("codigo_barras") || null,
      referencia_interna: formData.get("referencia_interna") || null,
      estoque_minimo: parseFloat(formData.get("estoque_minimo")) || 0,
      ponto_reposicao: parseFloat(formData.get("ponto_reposicao")) || 0,
      permite_venda_sem_estoque: formData.get("permite_venda_sem_estoque") === "on",
    };

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Produto" : "Novo Produto"}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="produto-form">
        <FormSection title="Identificação">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="codigo" label="Código" defaultValue={produto?.codigo || ""} fullWidth required size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField name="nome" label="Nome" defaultValue={produto?.nome || ""} fullWidth required size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="codigo_barras" label="Código de barras" defaultValue={produto?.codigo_barras || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="referencia_interna" label="Referência interna" defaultValue={produto?.referencia_interna || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="categoria" label="Categoria" defaultValue={produto?.categoria || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="descricao" label="Descrição" defaultValue={produto?.descricao || ""} fullWidth multiline rows={2} size="small" />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Preços e medidas">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="unidade_medida" label="Unidade" defaultValue={produto?.unidade_medida || ""} select fullWidth size="small">
                <MenuItem value=""><em>—</em></MenuItem>
                {UNIDADES.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="preco_custo" label="Preço custo" type="number" defaultValue={produto?.preco_custo || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="preco_venda" label="Preço venda" type="number" defaultValue={produto?.preco_venda || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="peso" label="Peso (kg)" type="number" defaultValue={produto?.peso || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Estoque">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="estoque_minimo" label="Estoque mínimo" type="number" defaultValue={produto?.estoque_minimo || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="ponto_reposicao" label="Ponto de reposição" type="number" defaultValue={produto?.ponto_reposicao || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={<Switch name="permite_venda_sem_estoque" defaultChecked={produto?.permite_venda_sem_estoque || false} />}
                label="Venda sem estoque"
              />
            </Grid>
          </Grid>
        </FormSection>
      </form>
    </FormDialog>
  );
}
```

### 5.3 `src/components/estoque/MovimentacaoDialog.jsx`

```jsx
import { Grid, TextField, MenuItem } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const TIPOS = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

export default function MovimentacaoDialog({ open, onClose, onSubmit, tipo = "ENTRADA", loading }) {
  const handleSubmit = () => {
    const form = document.getElementById("movimentacao-form");
    const formData = new FormData(form);

    const data = {
      tipo_movimentacao: formData.get("tipo_movimentacao"),
      produto_id: formData.get("produto_id"),
      quantidade: parseFloat(formData.get("quantidade")) || 0,
      motivo: formData.get("motivo"),
      observacoes: formData.get("observacoes") || null,
    };

    const tipoMov = data.tipo_movimentacao;
    if (tipoMov === "ENTRADA" || tipoMov === "TRANSFERENCIA") {
      data.local_destino_id = formData.get("local_destino_id") || null;
    }
    if (tipoMov === "SAIDA" || tipoMov === "TRANSFERENCIA") {
      data.local_origem_id = formData.get("local_origem_id") || null;
    }

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Nova Movimentação de Estoque"
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="sm"
    >
      <form id="movimentacao-form">
        <FormSection title="Dados da movimentação">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="tipo_movimentacao"
                label="Tipo"
                defaultValue={tipo}
                select
                fullWidth
                required
                size="small"
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="produto_id"
                label="ID do Produto"
                fullWidth
                required
                size="small"
                placeholder="UUID do produto"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="quantidade"
                label="Quantidade"
                type="number"
                fullWidth
                required
                size="small"
                slotProps={{ input: { inputProps: { min: 0.001, step: "0.001" } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="local_origem_id"
                label="Local de origem"
                fullWidth
                size="small"
                placeholder="UUID do local"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="local_destino_id"
                label="Local de destino"
                fullWidth
                size="small"
                placeholder="UUID do local"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="motivo" label="Motivo" fullWidth required size="small" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="observacoes" label="Observações" fullWidth multiline rows={2} size="small" />
            </Grid>
          </Grid>
        </FormSection>
      </form>
    </FormDialog>
  );
}
```

### 5.4 `src/components/vendas/VendaFormDialog.jsx`

```jsx
import { useState } from "react";
import { Grid, TextField, MenuItem, Typography, IconButton, Box, Divider } from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const TIPOS_VENDA = [
  { value: "NORMAL", label: "Normal" },
  { value: "FUTURA", label: "Futura" },
  { value: "DIRETA", label: "Direta" },
];

const FORMAS_PAGAMENTO = [
  { value: "A_VISTA", label: "À vista" },
  { value: "A_PRAZO", label: "A prazo" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO", label: "Cartão" },
  { value: "BOLETO", label: "Boleto" },
  { value: "DINHEIRO", label: "Dinheiro" },
];

const emptyItem = { produto_id: "", quantidade: "", preco_unitario: "", desconto_valor: "0" };

export default function VendaFormDialog({ open, onClose, onSubmit, loading }) {
  const [itens, setItens] = useState([{ ...emptyItem }]);

  const addItem = () => setItens([...itens, { ...emptyItem }]);

  const removeItem = (index) => {
    if (itens.length <= 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };
    setItens(updated);
  };

  const handleSubmit = () => {
    const form = document.getElementById("venda-form");
    const formData = new FormData(form);

    const data = {
      cliente_id: formData.get("cliente_id"),
      tipo_venda: formData.get("tipo_venda"),
      forma_pagamento: formData.get("forma_pagamento"),
      condicao_pagamento: formData.get("condicao_pagamento") || null,
      data_entrega_prevista: formData.get("data_entrega_prevista") || null,
      observacoes: formData.get("observacoes") || null,
      itens: itens
        .filter((item) => item.produto_id && item.quantidade)
        .map((item, i) => ({
          produto_id: item.produto_id,
          sequencia: i + 1,
          quantidade: parseFloat(item.quantidade) || 0,
          preco_unitario: parseFloat(item.preco_unitario) || 0,
          desconto_valor: parseFloat(item.desconto_valor) || 0,
        })),
    };

    onSubmit(data);
  };

  const handleClose = () => {
    setItens([{ ...emptyItem }]);
    onClose();
  };

  const calcTotal = () => {
    return itens.reduce((sum, item) => {
      const qty = parseFloat(item.quantidade) || 0;
      const price = parseFloat(item.preco_unitario) || 0;
      const desc = parseFloat(item.desconto_valor) || 0;
      return sum + (qty * price - desc);
    }, 0);
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Nova Venda"
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="venda-form">
        <FormSection title="Dados da venda">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="cliente_id"
                label="ID do Cliente"
                fullWidth
                required
                size="small"
                placeholder="UUID do cliente"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="tipo_venda" label="Tipo" defaultValue="NORMAL" select fullWidth required size="small">
                {TIPOS_VENDA.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="forma_pagamento" label="Pagamento" defaultValue="A_VISTA" select fullWidth required size="small">
                {FORMAS_PAGAMENTO.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField name="condicao_pagamento" label="Condição de pagamento" fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField name="data_entrega_prevista" label="Entrega prevista" type="date" fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Itens da venda">
          {itens.map((item, index) => (
            <Box key={index}>
              <Grid container spacing={1} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Produto ID"
                    value={item.produto_id}
                    onChange={(e) => updateItem(index, "produto_id", e.target.value)}
                    fullWidth
                    required
                    size="small"
                    placeholder="UUID"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Qtd."
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, "quantidade", e.target.value)}
                    fullWidth
                    required
                    size="small"
                    slotProps={{ input: { inputProps: { min: 0.001, step: "0.001" } } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Preço unit."
                    type="number"
                    value={item.preco_unitario}
                    onChange={(e) => updateItem(index, "preco_unitario", e.target.value)}
                    fullWidth
                    required
                    size="small"
                    slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Desconto"
                    type="number"
                    value={item.desconto_valor}
                    onChange={(e) => updateItem(index, "desconto_valor", e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }} sx={{ display: "flex", justifyContent: "center" }}>
                  <IconButton size="small" color="error" onClick={() => removeItem(index)} disabled={itens.length <= 1}>
                    <MdDelete size={18} />
                  </IconButton>
                </Grid>
              </Grid>
              {index < itens.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
            <IconButton size="small" color="primary" onClick={addItem}>
              <MdAdd size={20} />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Total estimado:{" "}
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calcTotal())}
            </Typography>
          </Box>
        </FormSection>

        <FormSection title="Observações">
          <TextField name="observacoes" label="Observações" fullWidth multiline rows={2} size="small" />
        </FormSection>
      </form>
    </FormDialog>
  );
}
```

### 5.5 `src/components/financeiro/PagamentoDialog.jsx`

```jsx
import { Grid, TextField, MenuItem } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const FORMAS = [
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CARTAO", label: "Cartão" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

export default function PagamentoDialog({ open, onClose, onSubmit, duplicata, loading }) {
  const handleSubmit = () => {
    const form = document.getElementById("pagamento-form");
    const formData = new FormData(form);

    const data = {
      forma_pagamento: formData.get("forma_pagamento"),
      valor: parseFloat(formData.get("valor")) || 0,
      referencia_externa: formData.get("referencia_externa") || null,
      observacoes: formData.get("observacoes") || null,
    };

    onSubmit(duplicata?.id, data);
  };

  const valorAberto = parseFloat(duplicata?.valor_aberto) || 0;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`Registrar Pagamento — ${duplicata?.numero || ""}`}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="sm"
    >
      <form id="pagamento-form">
        <FormSection title="Dados do pagamento">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="forma_pagamento"
                label="Forma de pagamento"
                defaultValue="PIX"
                select
                fullWidth
                required
                size="small"
              >
                {FORMAS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="valor"
                label="Valor"
                type="number"
                defaultValue={valorAberto}
                fullWidth
                required
                size="small"
                helperText={`Valor em aberto: R$ ${valorAberto.toFixed(2)}`}
                slotProps={{ input: { inputProps: { min: 0.01, max: valorAberto, step: "0.01" } } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="referencia_externa"
                label="Referência externa"
                fullWidth
                size="small"
                placeholder="Nº comprovante, ID transação..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="observacoes"
                label="Observações"
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            </Grid>
          </Grid>
        </FormSection>
      </form>
    </FormDialog>
  );
}
```

---

## 6. Páginas Principais

### 6.1 `src/pages/Dashboard/DashboardPage.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Card, CardContent, Typography, TextField, MenuItem } from "@mui/material";
import {
  MdPeople, MdStore, MdInventory, MdPointOfSale,
  MdAttachMoney, MdLocalShipping, MdTrendingUp, MdTrendingDown,
} from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import AlertBlock from "../../components/common/AlertBlock";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import dashboardService from "../../services/dashboardService";

const PERIODOS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "12m", label: "Últimos 12 meses" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [financeiro, setFinanceiro] = useState(null);
  const [estoque, setEstoque] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [periodo, setPeriodo] = useState("30d");

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resResumo, resFin, resEst, resAlertas] = await Promise.allSettled([
        dashboardService.getResumo(),
        dashboardService.getFinanceiro(),
        dashboardService.getEstoque(),
        dashboardService.getAlertas(),
      ]);
      if (resResumo.status === "fulfilled") setResumo(resResumo.value.data);
      if (resFin.status === "fulfilled") setFinanceiro(resFin.value.data);
      if (resEst.status === "fulfilled") setEstoque(resEst.value.data);
      if (resAlertas.status === "fulfilled") setAlertas(resAlertas.value.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  if (loading) return <Loading message="Carregando dashboard..." />;
  if (error && !resumo) return <ErrorState message={error} onRetry={carregarDados} />;

  const stats = [
    { title: "Clientes ativos", value: resumo?.total_clientes ?? "—", icon: MdPeople, color: "#1B5E20" },
    { title: "Fornecedores", value: resumo?.total_fornecedores ?? "—", icon: MdStore, color: "#0288D1" },
    { title: "Produtos ativos", value: resumo?.total_produtos ?? "—", icon: MdInventory, color: "#ED6C02" },
    { title: "Vendas (mês)", value: resumo?.vendas_mes ?? "—", icon: MdPointOfSale, color: "#9C27B0" },
    { title: "Receita (mês)", value: formatCurrency(resumo?.receita_mes), icon: MdTrendingUp, color: "#2E7D32" },
    { title: "Entregas ativas", value: resumo?.entregas_ativas ?? "—", icon: MdLocalShipping, color: "#D32F2F" },
  ];

  const alertasEstoque = estoque?.alertas_baixo_estoque?.map(
    (a) => `${a.produto_nome || a.nome} — saldo: ${a.saldo_atual ?? a.quantidade}`
  ) || [];

  const alertasVencimento = financeiro?.duplicatas_vencendo?.map(
    (d) => `${d.numero} — ${d.cliente_nome || "Cliente"} — vence em ${new Date(d.vencimento).toLocaleDateString("pt-BR")}`
  ) || [];

  const alertasVencidas = financeiro?.duplicatas_vencidas?.map(
    (d) => `${d.numero} — ${d.cliente_nome || "Cliente"} — ${formatCurrency(d.valor_aberto)}`
  ) || [];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema"
        actions={
          <TextField
            select
            size="small"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {PERIODOS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
        }
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.title}>
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>A receber</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                {formatCurrency(financeiro?.total_a_receber)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {financeiro?.total_duplicatas_abertas ?? 0} duplicata(s) em aberto
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vencido</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F" }}>
                {formatCurrency(financeiro?.total_vencido)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {financeiro?.total_duplicatas_vencidas ?? 0} duplicata(s) vencida(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Recebido (mês)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#0288D1" }}>
                {formatCurrency(financeiro?.total_recebido_mes)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {financeiro?.total_pagamentos_mes ?? 0} pagamento(s) registrado(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <MdTrendingUp size={40} color="#BDBDBD" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gráfico de séries de vendas será integrado aqui
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Endpoint: GET /dashboard/series/vendas
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {alertasVencidas.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertBlock title="Duplicatas vencidas" items={alertasVencidas} severity="error" />
          </Grid>
        )}
        {alertasVencimento.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertBlock title="Vencendo em breve" items={alertasVencimento} severity="warning" />
          </Grid>
        )}
        {alertasEstoque.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertBlock title="Estoque baixo" items={alertasEstoque} severity="warning" />
          </Grid>
        )}
        {!alertasVencidas.length && !alertasVencimento.length && !alertasEstoque.length && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum alerta no momento.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
```

### 6.2 `src/pages/Clientes/ClientesPage.jsx`

```jsx
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
      const params = { page: page + 1, limit: rowsPerPage };
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

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

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
```

### 6.3 `src/pages/Produtos/ProdutosPage.jsx`

```jsx
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
    { field: "ponto_reposicao", headerName: "Pt. repos.", align: "right" },
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
```

### 6.4 `src/pages/Estoque/EstoquePage.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
import { Box, Button, Tabs, Tab, Chip } from "@mui/material";
import { MdAdd, MdWarning } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import AlertBlock from "../../components/common/AlertBlock";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import MovimentacaoDialog from "../../components/estoque/MovimentacaoDialog";
import { usePermission } from "../../hooks/usePermission";
import estoqueService from "../../services/estoqueService";

function formatQty(val) {
  const n = parseFloat(val) || 0;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

export default function EstoquePage() {
  const { canCreate } = usePermission();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saldos, setSaldos] = useState([]);
  const [saldoSearch, setSaldoSearch] = useState("");
  const [saldoPage, setSaldoPage] = useState(0);
  const [saldoTotal, setSaldoTotal] = useState(0);

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [movSearch, setMovSearch] = useState("");
  const [movPage, setMovPage] = useState(0);
  const [movTotal, setMovTotal] = useState(0);

  const [alertas, setAlertas] = useState([]);

  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movDialogTipo, setMovDialogTipo] = useState("ENTRADA");
  const [movDialogLoading, setMovDialogLoading] = useState(false);

  const carregarSaldos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: saldoPage + 1, limit: 25 };
      if (saldoSearch) params.search = saldoSearch;

      const response = await estoqueService.listarSaldos(params);
      setSaldos(response.data?.items || []);
      setSaldoTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar saldos.");
    } finally {
      setLoading(false);
    }
  }, [saldoPage, saldoSearch]);

  const carregarMovimentacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: movPage + 1, limit: 25 };
      if (movSearch) params.search = movSearch;

      const response = await estoqueService.listarMovimentacoes(params);
      setMovimentacoes(response.data?.items || []);
      setMovTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar movimentações.");
    } finally {
      setLoading(false);
    }
  }, [movPage, movSearch]);

  const carregarAlertas = useCallback(async () => {
    try {
      const response = await estoqueService.getAlertasBaixoEstoque();
      setAlertas(response.data || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (tab === 0) carregarSaldos();
    else carregarMovimentacoes();
  }, [tab, carregarSaldos, carregarMovimentacoes]);

  useEffect(() => { carregarAlertas(); }, [carregarAlertas]);

  const handleMovSubmit = async (data) => {
    setMovDialogLoading(true);
    try {
      const handler = {
        ENTRADA: estoqueService.registrarEntrada,
        SAIDA: estoqueService.registrarSaida,
        TRANSFERENCIA: estoqueService.registrarTransferencia,
      }[data.tipo_movimentacao] || estoqueService.registrarEntrada;

      await handler(data);
      setMovDialogOpen(false);
      if (tab === 0) carregarSaldos(); else carregarMovimentacoes();
      carregarAlertas();
    } catch { /* interceptor */ } finally {
      setMovDialogLoading(false);
    }
  };

  const openMovDialog = (tipo) => {
    setMovDialogTipo(tipo);
    setMovDialogOpen(true);
  };

  const alertaItems = alertas.map(
    (a) => `${a.produto_nome || a.nome || "Produto"} — saldo: ${formatQty(a.quantidade ?? a.saldo_atual)} (mín: ${formatQty(a.estoque_minimo)})`
  );

  const saldoColumns = [
    { field: "produto_codigo", headerName: "Código" },
    { field: "produto_nome", headerName: "Produto" },
    { field: "local_nome", headerName: "Local" },
    {
      field: "quantidade",
      headerName: "Quantidade",
      align: "right",
      renderCell: (row) => {
        const qty = parseFloat(row.quantidade) || 0;
        const min = parseFloat(row.estoque_minimo) || 0;
        const isBaixo = min > 0 && qty <= min;
        return (
          <Chip
            label={formatQty(qty)}
            size="small"
            color={isBaixo ? "error" : "default"}
            variant={isBaixo ? "filled" : "outlined"}
            icon={isBaixo ? <MdWarning size={14} /> : undefined}
          />
        );
      },
    },
    { field: "reservado", headerName: "Reservado", align: "right", renderCell: (row) => formatQty(row.reservado) },
    {
      field: "disponivel",
      headerName: "Disponível",
      align: "right",
      renderCell: (row) => formatQty((parseFloat(row.quantidade) || 0) - (parseFloat(row.reservado) || 0)),
    },
  ];

  const movColumns = [
    {
      field: "data_movimentacao",
      headerName: "Data",
      renderCell: (row) => row.data_movimentacao ? new Date(row.data_movimentacao).toLocaleString("pt-BR") : "—",
    },
    {
      field: "tipo_movimentacao",
      headerName: "Tipo",
      renderCell: (row) => {
        const colors = { ENTRADA: "success", SAIDA: "error", TRANSFERENCIA: "info", AJUSTE: "warning" };
        return <Chip label={row.tipo_movimentacao} size="small" color={colors[row.tipo_movimentacao] || "default"} />;
      },
    },
    { field: "produto_nome", headerName: "Produto" },
    { field: "quantidade", headerName: "Qtd.", align: "right", renderCell: (row) => formatQty(row.quantidade) },
    { field: "local_origem_nome", headerName: "Origem" },
    { field: "local_destino_nome", headerName: "Destino" },
    { field: "motivo", headerName: "Motivo" },
  ];

  if (error && !saldos.length && !movimentacoes.length) {
    return <ErrorState message={error} onRetry={tab === 0 ? carregarSaldos : carregarMovimentacoes} />;
  }

  return (
    <Box>
      <PageHeader
        title="Estoque"
        subtitle="Controle de estoque e movimentações"
        actions={
          canCreate("estoque") && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={() => openMovDialog("ENTRADA")}>
                Entrada
              </Button>
              <Button variant="outlined" onClick={() => openMovDialog("SAIDA")}>Saída</Button>
              <Button variant="outlined" onClick={() => openMovDialog("TRANSFERENCIA")}>Transferência</Button>
            </Box>
          )
        }
      />

      {alertaItems.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <AlertBlock title="Produtos com estoque baixo" items={alertaItems} severity="warning" />
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Saldos" />
        <Tab label="Movimentações" />
      </Tabs>

      {tab === 0 && (
        <>
          <FilterToolbar
            searchValue={saldoSearch}
            onSearchChange={(v) => { setSaldoSearch(v); setSaldoPage(0); }}
            searchPlaceholder="Buscar produto..."
            onClear={() => { setSaldoSearch(""); setSaldoPage(0); }}
          />
          <DataTable
            columns={saldoColumns}
            rows={saldos}
            loading={loading}
            page={saldoPage}
            rowsPerPage={25}
            total={saldoTotal}
            onPageChange={(_, p) => setSaldoPage(p)}
            emptyMessage="Nenhum saldo de estoque encontrado"
          />
        </>
      )}

      {tab === 1 && (
        <>
          <FilterToolbar
            searchValue={movSearch}
            onSearchChange={(v) => { setMovSearch(v); setMovPage(0); }}
            searchPlaceholder="Buscar movimentação..."
            onClear={() => { setMovSearch(""); setMovPage(0); }}
          />
          <DataTable
            columns={movColumns}
            rows={movimentacoes}
            loading={loading}
            page={movPage}
            rowsPerPage={25}
            total={movTotal}
            onPageChange={(_, p) => setMovPage(p)}
            emptyMessage="Nenhuma movimentação encontrada"
          />
        </>
      )}

      <MovimentacaoDialog
        open={movDialogOpen}
        onClose={() => setMovDialogOpen(false)}
        onSubmit={handleMovSubmit}
        tipo={movDialogTipo}
        loading={movDialogLoading}
      />
    </Box>
  );
}
```

### 6.5 `src/pages/Vendas/VendasPage.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
import { Box, Button, IconButton, Tooltip, Chip } from "@mui/material";
import { MdAdd, MdVisibility, MdCancel } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import VendaFormDialog from "../../components/vendas/VendaFormDialog";
import { usePermission } from "../../hooks/usePermission";
import vendaService from "../../services/vendaService";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

const TIPO_COLORS = { NORMAL: "default", FUTURA: "info", DIRETA: "success" };

export default function VendasPage() {
  const { canCreate, canUpdate } = usePermission();

  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelVenda, setCancelVenda] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const carregarVendas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (tipoFilter) params.tipo_venda = tipoFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await vendaService.listar(params);
      setVendas(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar vendas.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, tipoFilter, statusFilter]);

  useEffect(() => { carregarVendas(); }, [carregarVendas]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      await vendaService.criar(data);
      setFormOpen(false);
      carregarVendas();
    } catch { /* interceptor */ } finally {
      setFormLoading(false);
    }
  };

  const handleCancelar = (venda) => {
    setCancelVenda(venda);
    setCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelVenda) return;
    setCancelLoading(true);
    try {
      await vendaService.cancelar(cancelVenda.id, "Cancelamento via interface");
      setCancelOpen(false);
      setCancelVenda(null);
      carregarVendas();
    } catch { /* interceptor */ } finally {
      setCancelLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setTipoFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const columns = [
    { field: "numero", headerName: "Número" },
    {
      field: "data_venda",
      headerName: "Data",
      renderCell: (row) => row.data_venda ? new Date(row.data_venda).toLocaleDateString("pt-BR") : "—",
    },
    { field: "cliente_nome", headerName: "Cliente" },
    {
      field: "tipo_venda",
      headerName: "Tipo",
      renderCell: (row) => (
        <Chip
          label={row.tipo_venda}
          size="small"
          color={TIPO_COLORS[row.tipo_venda] || "default"}
          variant={row.tipo_venda === "FUTURA" ? "filled" : "outlined"}
        />
      ),
    },
    { field: "forma_pagamento", headerName: "Pagamento" },
    {
      field: "total_valor",
      headerName: "Total",
      align: "right",
      renderCell: (row) => formatCurrency(row.total_valor),
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
          <Tooltip title="Visualizar">
            <IconButton size="small">
              <MdVisibility size={18} />
            </IconButton>
          </Tooltip>
          {canUpdate("vendas") && (row.status === "PENDENTE" || row.status === "CONFIRMADA") && (
            <Tooltip title="Cancelar">
              <IconButton size="small" color="error" onClick={() => handleCancelar(row)}>
                <MdCancel size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (error && !vendas.length) return <ErrorState message={error} onRetry={carregarVendas} />;

  return (
    <Box>
      <PageHeader
        title="Vendas"
        subtitle="Gerenciamento de vendas e pedidos"
        actions={
          canCreate("vendas") && (
            <Button variant="contained" startIcon={<MdAdd size={20} />} onClick={() => setFormOpen(true)}>
              Nova Venda
            </Button>
          )
        }
      />

      <FilterToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Buscar por número ou cliente..."
        filters={[
          {
            name: "tipo_venda",
            label: "Tipo",
            value: tipoFilter,
            onChange: (v) => { setTipoFilter(v); setPage(0); },
            options: [
              { value: "NORMAL", label: "Normal" },
              { value: "FUTURA", label: "Futura" },
              { value: "DIRETA", label: "Direta" },
            ],
          },
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(0); },
            options: [
              { value: "PENDENTE", label: "Pendente" },
              { value: "CONFIRMADA", label: "Confirmada" },
              { value: "FATURADA", label: "Faturada" },
              { value: "CANCELADA", label: "Cancelada" },
            ],
          },
        ]}
        onClear={handleClearFilters}
      />

      <DataTable
        columns={columns}
        rows={vendas}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        emptyMessage="Nenhuma venda encontrada"
      />

      <VendaFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar venda"
        message={`Deseja cancelar a venda "${cancelVenda?.numero}"? Esta ação não pode ser desfeita.`}
        confirmText="Cancelar venda"
        onConfirm={handleConfirmCancel}
        onCancel={() => { setCancelOpen(false); setCancelVenda(null); }}
        loading={cancelLoading}
      />
    </Box>
  );
}
```

### 6.6 `src/pages/Financeiro/FinanceiroPage.jsx`

```jsx
import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Card, CardContent, Typography, IconButton, Tooltip } from "@mui/material";
import { MdPayment, MdVisibility } from "react-icons/md";
import PageHeader from "../../components/common/PageHeader";
import FilterToolbar from "../../components/common/FilterToolbar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import AlertBlock from "../../components/common/AlertBlock";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";
import PagamentoDialog from "../../components/financeiro/PagamentoDialog";
import { usePermission } from "../../hooks/usePermission";
import financeiroService from "../../services/financeiroService";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function isVencida(duplicata) {
  return duplicata.status === "VENCIDO" || (
    duplicata.status !== "PAGO" && duplicata.status !== "CANCELADO" &&
    new Date(duplicata.vencimento) < new Date()
  );
}

function isVencendoBreve(duplicata) {
  if (duplicata.status === "PAGO" || duplicata.status === "CANCELADO") return false;
  const venc = new Date(duplicata.vencimento);
  const hoje = new Date();
  const diff = (venc - hoje) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

export default function FinanceiroPage() {
  const { canCreate } = usePermission();

  const [duplicatas, setDuplicatas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [resumo, setResumo] = useState(null);
  const [alertasVencidas, setAlertasVencidas] = useState([]);
  const [alertasVencendo, setAlertasVencendo] = useState([]);

  const [pagDialogOpen, setPagDialogOpen] = useState(false);
  const [pagDuplicata, setPagDuplicata] = useState(null);
  const [pagLoading, setPagLoading] = useState(false);

  const carregarDuplicatas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await financeiroService.listarDuplicatas(params);
      setDuplicatas(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar duplicatas.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  const carregarResumoEAlertas = useCallback(async () => {
    try {
      const [resResumo, resVencidas, resVencendo] = await Promise.allSettled([
        financeiroService.getResumo(),
        financeiroService.getAlertasVencidas(),
        financeiroService.getAlertasVencendo(),
      ]);
      if (resResumo.status === "fulfilled") setResumo(resResumo.value.data);
      if (resVencidas.status === "fulfilled") setAlertasVencidas(resVencidas.value.data || []);
      if (resVencendo.status === "fulfilled") setAlertasVencendo(resVencendo.value.data || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregarDuplicatas(); }, [carregarDuplicatas]);
  useEffect(() => { carregarResumoEAlertas(); }, [carregarResumoEAlertas]);

  const handlePagamento = (duplicata) => {
    setPagDuplicata(duplicata);
    setPagDialogOpen(true);
  };

  const handlePagSubmit = async (duplicataId, data) => {
    setPagLoading(true);
    try {
      await financeiroService.registrarPagamento(duplicataId, data);
      setPagDialogOpen(false);
      setPagDuplicata(null);
      carregarDuplicatas();
      carregarResumoEAlertas();
    } catch { /* interceptor */ } finally {
      setPagLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(0);
  };

  const vencidasItems = (Array.isArray(alertasVencidas) ? alertasVencidas : []).map(
    (d) => `${d.numero} — ${d.cliente_nome || "Cliente"} — ${formatCurrency(d.valor_aberto)}`
  );

  const vencendoItems = (Array.isArray(alertasVencendo) ? alertasVencendo : []).map(
    (d) => `${d.numero} — vence em ${formatDate(d.vencimento)} — ${formatCurrency(d.valor_aberto)}`
  );

  const columns = [
    { field: "numero", headerName: "Número" },
    { field: "parcela", headerName: "Parc.", align: "center" },
    { field: "cliente_nome", headerName: "Cliente" },
    {
      field: "valor_total",
      headerName: "Valor total",
      align: "right",
      renderCell: (row) => formatCurrency(row.valor_total),
    },
    {
      field: "valor_aberto",
      headerName: "Valor aberto",
      align: "right",
      renderCell: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: parseFloat(row.valor_aberto) > 0 ? 600 : 400,
            color: parseFloat(row.valor_aberto) > 0 ? "error.main" : "text.secondary",
          }}
        >
          {formatCurrency(row.valor_aberto)}
        </Typography>
      ),
    },
    {
      field: "vencimento",
      headerName: "Vencimento",
      renderCell: (row) => {
        const vencida = isVencida(row);
        const vencendo = isVencendoBreve(row);
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: vencida || vencendo ? 600 : 400,
              color: vencida ? "error.main" : vencendo ? "warning.main" : "text.primary",
            }}
          >
            {formatDate(row.vencimento)}
          </Typography>
        );
      },
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
          <Tooltip title="Visualizar">
            <IconButton size="small">
              <MdVisibility size={18} />
            </IconButton>
          </Tooltip>
          {canCreate("financeiro") && row.status !== "PAGO" && row.status !== "CANCELADO" && (
            <Tooltip title="Registrar pagamento">
              <IconButton size="small" color="success" onClick={() => handlePagamento(row)}>
                <MdPayment size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (error && !duplicatas.length) return <ErrorState message={error} onRetry={carregarDuplicatas} />;

  return (
    <Box>
      <PageHeader title="Financeiro" subtitle="Controle financeiro e duplicatas" />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Em aberto</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "warning.main" }}>
                {formatCurrency(resumo?.total_em_aberto)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resumo?.qtd_em_aberto ?? 0} duplicata(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vencidas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>
                {formatCurrency(resumo?.total_vencido)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resumo?.qtd_vencidas ?? 0} duplicata(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pagas (mês)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>
                {formatCurrency(resumo?.total_pago_mes)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resumo?.qtd_pagas_mes ?? 0} duplicata(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {vencidasItems.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <AlertBlock title="Duplicatas vencidas" items={vencidasItems} severity="error" />
          </Grid>
        )}
        {vencendoItems.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <AlertBlock title="Vencendo nos próximos 7 dias" items={vencendoItems} severity="warning" />
          </Grid>
        )}
      </Grid>

      <FilterToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Buscar por número ou cliente..."
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(0); },
            options: [
              { value: "EM_ABERTO", label: "Em aberto" },
              { value: "PAGO_PARCIALMENTE", label: "Pago parcialmente" },
              { value: "PAGO", label: "Pago" },
              { value: "VENCIDO", label: "Vencido" },
              { value: "CANCELADO", label: "Cancelado" },
            ],
          },
        ]}
        onClear={handleClearFilters}
      />

      <DataTable
        columns={columns}
        rows={duplicatas}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        emptyMessage="Nenhuma duplicata encontrada"
      />

      <PagamentoDialog
        open={pagDialogOpen}
        onClose={() => { setPagDialogOpen(false); setPagDuplicata(null); }}
        onSubmit={handlePagSubmit}
        duplicata={pagDuplicata}
        loading={pagLoading}
      />
    </Box>
  );
}
```

---

## 7. Estratégia de Loading, Erro e Vazio

| Estado | Componente | Comportamento |
|--------|-----------|--------------|
| **Loading** | `<Loading />` | Spinner centralizado com mensagem |
| **Erro** | `<ErrorState />` | Ícone vermelho + mensagem + botão "Tentar novamente" |
| **Vazio** | `<EmptyState />` | Ícone cinza + mensagem personalizada |

Cada página implementa:
1. Estado `loading` inicia `true`, exibe `Loading` ou delega ao `DataTable`
2. Estado `error` captura falhas do service, exibe `ErrorState` se não há dados
3. `DataTable` internamente já trata loading e empty
4. Dashboard usa `Promise.allSettled` para carregar parcialmente mesmo com erros

---

## 8. Estratégia de Filtros e Tabelas

| Componente | Responsabilidade |
|-----------|-----------------|
| `FilterToolbar` | Barra de busca + selects de filtro + botão limpar |
| `DataTable` | Tabela com paginação, colunas dinâmicas, `renderCell` |
| `StatusBadge` | Chips coloridos para status |

**Padrão de paginação**: Backend espera `page` (1-based) e `limit`. Frontend usa `page` (0-based) do MUI TablePagination e converte: `page + 1`.

**Padrão de busca**: Debounce natural via `useEffect` + `useCallback`. Search filtra no backend.

---

## 9. Estratégia de Formulários e Dialogs

| Componente | Responsabilidade |
|-----------|-----------------|
| `FormDialog` | Wrapper genérico: Dialog + form + submit/cancel |
| `FormSection` | Agrupamento visual com título uppercase |
| Dialogs específicos | `ClienteFormDialog`, `ProdutoFormDialog`, etc. |

**Padrão**:
- Formulário com `id` referenciado via `document.getElementById`
- `FormData` extrai valores no submit
- Parsing explícito (`parseFloat`, `|| null`) para tipos corretos
- `defaultValue` para preencher no modo edição
- `loading` desabilita botões durante submissão

---

## 10. Fluxo de Integração com Backend

```
1. Usuário abre /clientes
2. ClientesPage.useEffect → clienteService.listar({ page:1, limit:25 })
3. Axios envia GET /api/clientes?page=1&limit=25 (com token JWT)
4. Backend retorna { status:"success", data:{ items:[], pagination:{} } }
5. DataTable renderiza items com paginação
6. Usuário clica "Novo Cliente" → abre ClienteFormDialog
7. Preenche form → submit → clienteService.criar(data)
8. Axios envia POST /api/clientes com body JSON
9. Backend valida, cria, retorna 201
10. Dialog fecha → carregarClientes() → tabela atualiza
```
