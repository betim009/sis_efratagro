# Estrutura Base do Frontend — ERP Efrat Agro

## 1. Explicação da Arquitetura

O frontend segue uma arquitetura de **camadas separadas por responsabilidade**:

| Camada | Pasta | Responsabilidade |
|--------|-------|-----------------|
| **Pages** | `src/pages/` | Telas completas, uma pasta por módulo |
| **Components** | `src/components/` | Componentes visuais reutilizáveis |
| **Routes** | `src/routes/` | Roteamento, proteção de rotas, code-splitting |
| **Services** | `src/services/` | Comunicação com a API via Axios |
| **Contexts** | `src/contexts/` | Estado global (auth) |
| **Hooks** | `src/hooks/` | Hooks customizados (auth, permissões, API) |
| **Styles** | `src/styles/` | Tema MUI + CSS global |

### Stack

- **React 19** com JavaScript (sem TypeScript)
- **Vite 8** — bundler com HMR, proxy e code-splitting
- **Material UI 7** — design system profissional
- **React Router 7** — roteamento SPA com lazy loading
- **Axios** — cliente HTTP com interceptors para JWT
- **React Icons** — ícones Material Design na sidebar/header

### Decisões de Design

| Decisão | Justificativa |
|---------|--------------|
| Lazy loading em todas as páginas | Chunk principal < 250KB, carregamento sob demanda |
| Proxy no Vite para `/api` | Dev sem CORS, produção com reverse proxy |
| `AuthContext` com `hasPermission()` | Permissões verificadas no frontend sem duplicar lógica |
| `crudService` factory | Evita repetição de código para módulos CRUD padrão |
| Sidebar com filtro por permissão | Usuário só vê menus que pode acessar |
| `ProtectedRoute` com prop `permission` | Proteção por rota sem código duplicado |
| `useApi` hook genérico | Loading/error state padronizado para qualquer chamada |

---

## 2. Estrutura de Pastas

```
frontend/
├── index.html
├── .env
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   ├── theme.js
    │   └── global.css
    ├── services/
    │   ├── api.js
    │   ├── authService.js
    │   ├── crudService.js
    │   ├── dashboardService.js
    │   └── notificacaoService.js
    ├── contexts/
    │   └── AuthContext.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   ├── usePermission.js
    │   └── useApi.js
    ├── components/
    │   ├── layout/
    │   │   ├── MainLayout.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Header.jsx
    │   └── common/
    │       ├── Loading.jsx
    │       ├── EmptyState.jsx
    │       ├── ConfirmDialog.jsx
    │       ├── DataTable.jsx
    │       ├── StatCard.jsx
    │       ├── StatusBadge.jsx
    │       └── PageHeader.jsx
    ├── routes/
    │   ├── AppRoutes.jsx
    │   └── ProtectedRoute.jsx
    └── pages/
        ├── Login/LoginPage.jsx
        ├── Dashboard/DashboardPage.jsx
        ├── Clientes/ClientesPage.jsx
        ├── Fornecedores/FornecedoresPage.jsx
        ├── Produtos/ProdutosPage.jsx
        ├── Estoque/EstoquePage.jsx
        ├── Vendas/VendasPage.jsx
        ├── Financeiro/FinanceiroPage.jsx
        ├── Frota/FrotaPage.jsx
        ├── Entregas/EntregasPage.jsx
        ├── Relatorios/RelatoriosPage.jsx
        ├── Fretes/FretesPage.jsx
        ├── Auditoria/AuditoriaPage.jsx
        ├── Notificacoes/NotificacoesPage.jsx
        ├── AcessoNegado/AcessoNegadoPage.jsx
        └── NotFound/NotFoundPage.jsx
```

---

## 3. Código Completo dos Arquivos Base

### 3.1 `index.html`

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <title>ERP Efrat Agro</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 3.2 `vite.config.js`

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

### 3.3 `.env`

```
VITE_API_BASE_URL=/api
```

### 3.4 `src/main.jsx`

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import theme from "./styles/theme";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
```

### 3.5 `src/App.jsx`

```jsx
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return <AppRoutes />;
}
```

---

## 4. Layout Administrativo

### 4.1 `src/components/layout/MainLayout.jsx`

```jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";

const DRAWER_WIDTH = 260;

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar open={sidebarOpen} drawerWidth={DRAWER_WIDTH} />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          ml: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: "margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1)",
        }}
      >
        <Header onToggleSidebar={handleToggleSidebar} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: "background.default",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
```

### 4.2 `src/components/layout/Sidebar.jsx`

```jsx
import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer, Box, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Divider,
} from "@mui/material";
import {
  MdDashboard, MdPeople, MdStore, MdInventory, MdWarehouse,
  MdPointOfSale, MdAttachMoney, MdLocalShipping, MdDirectionsCar,
  MdAssessment, MdReceipt, MdSecurity, MdNotifications,
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 2.5, px: 2 }}>
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
                {index > 0 && <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1 }} />}
                <Typography
                  variant="caption"
                  sx={{
                    px: 2, py: 0.5, display: "block",
                    color: "rgba(255,255,255,0.5)", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          if (item.permission && !hasPermission(item.permission)) return null;

          const isActive = location.pathname === item.path
            || location.pathname.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.3 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5, py: 1,
                  backgroundColor: isActive ? "rgba(249, 168, 37, 0.15)" : "transparent",
                  "&:hover": {
                    backgroundColor: isActive ? "rgba(249, 168, 37, 0.25)" : "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#F9A825" : "rgba(255,255,255,0.7)", minWidth: 40 }}>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#F9A825" : "rgba(255,255,255,0.9)",
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

### 4.3 `src/components/layout/Header.jsx`

```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Badge, Menu, MenuItem, Divider, Avatar,
} from "@mui/material";
import { MdMenu, MdNotifications, MdLogout, MdPerson } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import notificacaoService from "../../services/notificacaoService";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchNaoLidas = async () => {
      try {
        const response = await notificacaoService.contarNaoLidas();
        if (mounted) setNaoLidas(response.data?.total || 0);
      } catch { /* silencioso */ }
    };
    fetchNaoLidas();
    const interval = setInterval(fetchNaoLidas, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <AppBar position="sticky" elevation={0}
      sx={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Toolbar>
        <IconButton onClick={onToggleSidebar} edge="start" sx={{ mr: 2, color: "text.primary" }}>
          <MdMenu size={24} />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => navigate("/notificacoes")} sx={{ color: "text.secondary", mr: 1 }}>
          <Badge badgeContent={naoLidas} color="error" max={99}>
            <MdNotifications size={22} />
          </Badge>
        </IconButton>
        <Box onClick={handleMenuOpen}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 1, ml: 1 }}
        >
          <Avatar sx={{ width: 34, height: 34, fontSize: "0.85rem", bgcolor: "primary.main" }}>
            {initials}
          </Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
              {user?.name || "Usuário"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1 }}>
              {user?.profile?.name || ""}
            </Typography>
          </Box>
        </Box>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 180 } } }}
        >
          <MenuItem disabled>
            <MdPerson size={18} style={{ marginRight: 8 }} />{user?.email || ""}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <MdLogout size={18} style={{ marginRight: 8 }} />Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
```

---

## 5. Configuração do Tema MUI

### `src/styles/theme.js`

```javascript
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1B5E20",       // Verde escuro — identidade agro
      light: "#4C8C4A",
      dark: "#003300",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#F9A825",       // Amarelo dourado — destaque
      light: "#FFD95A",
      dark: "#C17900",
      contrastText: "#000000",
    },
    background: {
      default: "#F5F5F5",    // Cinza claro de fundo
      paper: "#FFFFFF",
    },
    error: { main: "#D32F2F" },
    warning: { main: "#ED6C02" },
    info: { main: "#0288D1" },
    success: { main: "#2E7D32" },
    text: {
      primary: "#212121",
      secondary: "#616161",
    },
    divider: "#E0E0E0",
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: "8px 20px" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": { fontWeight: 600, backgroundColor: "#F5F5F5" },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { border: "none" } },
    },
  },
});

export default theme;
```

### `src/styles/global.css`

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #F5F5F5;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #BDBDBD; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #9E9E9E; }
```

---

## 6. Configuração do Axios

### `src/services/api.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      if (status === 403) {
        window.location.href = "/acesso-negado";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `src/services/authService.js`

```javascript
import api from "./api";

const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  requestPasswordReset: async (email) => {
    const response = await api.post("/auth/password-reset/request", { email });
    return response.data;
  },
  confirmPasswordReset: async (token, newPassword) => {
    const response = await api.post("/auth/password-reset/confirm", { token, newPassword });
    return response.data;
  },
};

export default authService;
```

### `src/services/crudService.js`

```javascript
import api from "./api";

const createCrudService = (basePath) => ({
  listar: async (params = {}) => {
    const response = await api.get(basePath, { params });
    return response.data;
  },
  buscarPorId: async (id) => {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
  },
  criar: async (data) => {
    const response = await api.post(basePath, data);
    return response.data;
  },
  atualizar: async (id, data) => {
    const response = await api.put(`${basePath}/${id}`, data);
    return response.data;
  },
  excluir: async (id) => {
    const response = await api.delete(`${basePath}/${id}`);
    return response.data;
  },
});

export const clienteService = createCrudService("/clientes");
export const fornecedorService = createCrudService("/fornecedores");
export const produtoService = createCrudService("/produtos");
export const freteService = createCrudService("/fretes");

export default createCrudService;
```

### `src/services/dashboardService.js`

```javascript
import api from "./api";

const dashboardService = {
  getResumo: async () => {
    const response = await api.get("/dashboard/resumo");
    return response.data;
  },
};

export default dashboardService;
```

### `src/services/notificacaoService.js`

```javascript
import api from "./api";

const notificacaoService = {
  listar: async (params = {}) => {
    const response = await api.get("/notificacoes", { params });
    return response.data;
  },
  contarNaoLidas: async () => {
    const response = await api.get("/notificacoes/nao-lidas/contagem");
    return response.data;
  },
  marcarComoLida: async (id) => {
    const response = await api.patch(`/notificacoes/${id}/marcar-lida`);
    return response.data;
  },
  marcarTodasComoLidas: async () => {
    const response = await api.patch("/notificacoes/marcar-todas-lidas");
    return response.data;
  },
  arquivar: async (id) => {
    const response = await api.patch(`/notificacoes/${id}/arquivar`);
    return response.data;
  },
};

export default notificacaoService;
```

---

## 7. Configuração do AuthContext

### `src/contexts/AuthContext.jsx`

```jsx
import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    try {
      const response = await authService.getMe();
      setUser(response.data);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user: userData } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); }
    catch { /* ignora */ }
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes("*")) return true;
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  const value = useMemo(() => ({
    user, loading, isAuthenticated: !!user,
    login, logout, hasPermission, hasAnyPermission,
  }), [user, loading, login, logout, hasPermission, hasAnyPermission]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### `src/hooks/useAuth.js`

```javascript
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}
```

### `src/hooks/usePermission.js`

```javascript
import { useAuth } from "./useAuth";

export function usePermission() {
  const { hasPermission, hasAnyPermission } = useAuth();

  const canRead = (module) => hasPermission(`${module}.read`);
  const canCreate = (module) => hasPermission(`${module}.create`);
  const canUpdate = (module) => hasPermission(`${module}.update`);
  const canDelete = (module) => hasPermission(`${module}.delete`);

  return { hasPermission, hasAnyPermission, canRead, canCreate, canUpdate, canDelete };
}
```

### `src/hooks/useApi.js`

```javascript
import { useState, useCallback } from "react";

export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction(...args);
      setData(response.data || response);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Erro inesperado";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null); setError(null); setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
```

---

## 8. Rotas Públicas e Privadas

### `src/routes/ProtectedRoute.jsx`

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  if (loading) return <Loading message="Verificando autenticação..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/acesso-negado" replace />;

  return children;
}
```

### `src/routes/AppRoutes.jsx`

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import Loading from "../components/common/Loading";

const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const ClientesPage = lazy(() => import("../pages/Clientes/ClientesPage"));
const FornecedoresPage = lazy(() => import("../pages/Fornecedores/FornecedoresPage"));
const ProdutosPage = lazy(() => import("../pages/Produtos/ProdutosPage"));
const EstoquePage = lazy(() => import("../pages/Estoque/EstoquePage"));
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

const privateRoutes = [
  { path: "dashboard", element: <DashboardPage />, permission: "dashboard.read" },
  { path: "clientes", element: <ClientesPage />, permission: "clientes.read" },
  { path: "fornecedores", element: <FornecedoresPage />, permission: "fornecedores.read" },
  { path: "produtos", element: <ProdutosPage />, permission: "produtos.read" },
  { path: "estoque", element: <EstoquePage />, permission: "estoque.read" },
  { path: "vendas", element: <VendasPage />, permission: "vendas.read" },
  { path: "financeiro", element: <FinanceiroPage />, permission: "financeiro.read" },
  { path: "frota", element: <FrotaPage />, permission: "frota.read" },
  { path: "entregas", element: <EntregasPage />, permission: "entregas.read" },
  { path: "relatorios", element: <RelatoriosPage />, permission: "relatorios.read" },
  { path: "fretes", element: <FretesPage />, permission: "fretes.read" },
  { path: "auditoria", element: <AuditoriaPage />, permission: "auditoria.read" },
  { path: "notificacoes", element: <NotificacoesPage />, permission: "notificacoes.read" },
];

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {privateRoutes.map(({ path, element, permission }) => (
            <Route key={path} path={path}
              element={<ProtectedRoute permission={permission}>{element}</ProtectedRoute>}
            />
          ))}

          <Route path="acesso-negado" element={<AcessoNegadoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
```

### Mapa de Rotas

| Tipo | Rota | Permissão | Componente |
|------|------|-----------|-----------|
| Pública | `/login` | — | `LoginPage` |
| Privada | `/` | — | Redireciona → `/dashboard` |
| Privada | `/dashboard` | `dashboard.read` | `DashboardPage` |
| Privada | `/clientes` | `clientes.read` | `ClientesPage` |
| Privada | `/fornecedores` | `fornecedores.read` | `FornecedoresPage` |
| Privada | `/produtos` | `produtos.read` | `ProdutosPage` |
| Privada | `/estoque` | `estoque.read` | `EstoquePage` |
| Privada | `/vendas` | `vendas.read` | `VendasPage` |
| Privada | `/financeiro` | `financeiro.read` | `FinanceiroPage` |
| Privada | `/frota` | `frota.read` | `FrotaPage` |
| Privada | `/entregas` | `entregas.read` | `EntregasPage` |
| Privada | `/relatorios` | `relatorios.read` | `RelatoriosPage` |
| Privada | `/fretes` | `fretes.read` | `FretesPage` |
| Privada | `/auditoria` | `auditoria.read` | `AuditoriaPage` |
| Privada | `/notificacoes` | `notificacoes.read` | `NotificacoesPage` |
| Auxiliar | `/acesso-negado` | — | `AcessoNegadoPage` |
| Auxiliar | `*` | — | `NotFoundPage` |

---

## 9. Componentes Reutilizáveis

### `src/components/common/Loading.jsx`

```jsx
import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading({ message = "Carregando..." }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 2 }}>
      <CircularProgress color="primary" />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );
}
```

### `src/components/common/EmptyState.jsx`

```jsx
import { Box, Typography } from "@mui/material";
import { MdInbox } from "react-icons/md";

export default function EmptyState({ icon: Icon = MdInbox, title = "Nenhum registro encontrado", description = "" }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 1.5 }}>
      <Icon size={56} color="#BDBDBD" />
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
    </Box>
  );
}
```

### `src/components/common/ConfirmDialog.jsx`

```jsx
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export default function ConfirmDialog({
  open, title = "Confirmar ação", message = "Deseja realmente prosseguir?",
  confirmText = "Confirmar", cancelText = "Cancelar", confirmColor = "error",
  onConfirm, onCancel, loading = false,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>{cancelText}</Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor} disabled={loading}>
          {loading ? "Aguarde..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### `src/components/common/DataTable.jsx`

```jsx
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, Box,
} from "@mui/material";
import Loading from "./Loading";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [], rows = [], loading = false,
  page = 0, rowsPerPage = 25, total = 0,
  onPageChange, onRowsPerPageChange,
  emptyMessage = "Nenhum registro encontrado",
}) {
  if (loading) return <Loading />;
  if (!rows.length) return <EmptyState title={emptyMessage} />;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field}
                  sx={{ fontWeight: 600, whiteSpace: "nowrap", ...(col.headerSx || {}) }}
                  align={col.align || "left"}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                {columns.map((col) => (
                  <TableCell key={col.field} align={col.align || "left"}>
                    {col.renderCell ? col.renderCell(row) : row[col.field] ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <TablePagination component="div" count={total} page={page}
            onPageChange={onPageChange} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`}
          />
        </Box>
      )}
    </Paper>
  );
}
```

### `src/components/common/StatCard.jsx`

```jsx
import { Card, CardContent, Box, Typography } from "@mui/material";

export default function StatCard({ title, value, icon: Icon, color = "primary.main" }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {Icon && (
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: `${color}15`, color, flexShrink: 0,
          }}>
            <Icon size={24} />
          </Box>
        )}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.3 }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
```

### `src/components/common/StatusBadge.jsx`

```jsx
import { Chip } from "@mui/material";

const statusConfig = {
  ATIVO: { label: "Ativo", color: "success" },
  INATIVO: { label: "Inativo", color: "default" },
  BLOQUEADO: { label: "Bloqueado", color: "error" },
  PENDENTE: { label: "Pendente", color: "warning" },
  CONCLUIDO: { label: "Concluído", color: "success" },
  CANCELADO: { label: "Cancelado", color: "error" },
  EM_ANDAMENTO: { label: "Em andamento", color: "info" },
  NAO_LIDA: { label: "Não lida", color: "warning" },
  LIDA: { label: "Lida", color: "default" },
  ARQUIVADA: { label: "Arquivada", color: "default" },
  BAIXA: { label: "Baixa", color: "default" },
  MEDIA: { label: "Média", color: "info" },
  ALTA: { label: "Alta", color: "warning" },
  CRITICA: { label: "Crítica", color: "error" },
};

export default function StatusBadge({ status, size = "small" }) {
  const config = statusConfig[status] || { label: status || "—", color: "default" };
  return <Chip label={config.label} color={config.color} size={size} />;
}
```

### `src/components/common/PageHeader.jsx`

```jsx
import { Box, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>}
    </Box>
  );
}
```

---

## 10. Exemplo de Navegação da Sidebar

A sidebar organiza os 14 módulos do ERP em **4 seções**:

| Seção | Módulos |
|-------|---------|
| — | Dashboard |
| **Cadastros** | Clientes, Fornecedores, Produtos |
| **Operações** | Estoque, Vendas, Financeiro |
| **Logística** | Frota, Entregas, Fretes |
| **Sistema** | Relatórios, Auditoria, Notificações |

Cada item verifica `hasPermission()` antes de renderizar — o usuário só vê os menus que pode acessar. O item ativo recebe destaque visual em amarelo dourado (#F9A825) para contraste com o fundo verde escuro.

---

## 11. Como Iniciar o Projeto

```bash
# Na raiz do projeto
cd frontend

# Instalar dependências (já feito)
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Acessar em http://localhost:5173
# O proxy do Vite encaminha /api → http://localhost:3001
```

**Variáveis de ambiente opcionais (`.env`):**

| Variável | Default | Descrição |
|----------|---------|-----------|
| `VITE_API_BASE_URL` | `/api` | Base URL para chamadas ao backend |

**Build de produção:**

```bash
npm run build    # Gera dist/
npm run preview  # Preview do build
```

---

## 12. Estrutura Pronta para Evolução

### Para adicionar um novo módulo:

1. Criar pasta `src/pages/NomeModulo/NomeModuloPage.jsx`
2. Adicionar service em `src/services/` (usar `createCrudService` se CRUD padrão)
3. Adicionar rota no array `privateRoutes` em `AppRoutes.jsx`
4. Adicionar item no array `menuItems` em `Sidebar.jsx`
5. Pronto — layout, proteção de rota e permissão já funcionam

### Componentes prontos para uso:

| Componente | Uso |
|-----------|-----|
| `DataTable` | Qualquer listagem com paginação |
| `PageHeader` | Título + botão de ação em toda página |
| `StatCard` | Cards de resumo no dashboard |
| `StatusBadge` | Exibição de status coloridos |
| `ConfirmDialog` | Confirmação antes de exclusão/ação destrutiva |
| `EmptyState` | Estado vazio padrão para qualquer listagem |
| `Loading` | Spinner centralizado |

### Hooks prontos:

| Hook | Uso |
|------|-----|
| `useAuth()` | Acesso a user, login, logout, hasPermission |
| `usePermission()` | Atalhos canRead, canCreate, canUpdate, canDelete |
| `useApi(fn)` | Loading/error/data automáticos para qualquer chamada de service |
