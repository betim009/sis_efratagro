# Integração Frontend + Backend — ERP Efrat Agro

## 1. Estratégia de Integração

### Visão geral

A integração segue uma arquitetura em camadas com responsabilidades bem definidas:

```
┌─────────────────────────────────────────────────────────┐
│  Páginas (React)                                        │
│   └── usam useAuth / usePermission                      │
├─────────────────────────────────────────────────────────┤
│  AuthContext (estado global de autenticação)             │
│   └── normaliza permissões do backend                   │
│   └── escuta evento de sessão expirada                  │
├─────────────────────────────────────────────────────────┤
│  Services (authService, clienteService, etc.)           │
│   └── consomem api.js (Axios)                           │
├─────────────────────────────────────────────────────────┤
│  api.js — Axios configurado                             │
│   ├── interceptor request: injeta token                 │
│   ├── interceptor response: trata 401/403               │
│   └── emite evento customizado em sessão expirada       │
├─────────────────────────────────────────────────────────┤
│  tokenStorage.js — acesso centralizado ao localStorage  │
├─────────────────────────────────────────────────────────┤
│  permissions.js — normalização e verificação             │
└─────────────────────────────────────────────────────────┘
```

### Decisões técnicas

| Decisão | Justificativa |
|---------|--------------|
| **localStorage** (não sessionStorage) | Sessão sobrevive a refresh e novas abas |
| **Evento customizado para 401** | Evita `window.location.href` que causa reload completo; AuthContext redireciona via React Router |
| **Normalização de permissões** | Backend retorna objeto `{ modulo: { action: bool } }`, frontend precisa de array `["modulo.action"]` |
| **Interceptors centralizados** | Token injetado automaticamente, sem repetição em cada service |
| **ProtectedRoute + PermissionRoute** | Separação clara: autenticação vs autorização |

---

## 2. Estrutura de Arquivos

```
frontend/
├── .env.example
└── src/
    ├── services/
    │   ├── api.js                  (reescrito)
    │   └── authService.js          (atualizado)
    ├── utils/
    │   ├── tokenStorage.js         (novo)
    │   └── permissions.js          (novo)
    ├── contexts/
    │   └── AuthContext.jsx          (reescrito)
    ├── hooks/
    │   ├── useAuth.js              (mantido)
    │   └── usePermission.js        (atualizado)
    ├── routes/
    │   ├── ProtectedRoute.jsx      (atualizado)
    │   ├── PermissionRoute.jsx     (novo)
    │   └── AppRoutes.jsx           (mantido)
    └── pages/
        └── Login/LoginPage.jsx     (atualizado)
```

---

## 3. Código Completo dos Arquivos

### 3.1 `.env.example`

```env
# Variáveis de ambiente do frontend — ERP Efrat Agro
# Copie para .env e ajuste os valores

# URL base da API backend (sem barra final)
VITE_API_BASE_URL=http://localhost:3000/api

# Timeout das requisições em milissegundos (opcional, default: 30000)
# VITE_API_TIMEOUT=30000
```

### 3.2 `src/utils/tokenStorage.js`

```javascript
const TOKEN_KEY = "efrat_token";
const USER_KEY = "efrat_user";

const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),

  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),

  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  hasToken: () => !!localStorage.getItem(TOKEN_KEY),
};

export default tokenStorage;
```

**Por que localStorage e não sessionStorage?**
- O usuário permanece logado após refresh da página
- Sessão compartilhada entre abas do mesmo navegador
- O backend já controla a expiração real via TTL do JWT e da sessão no banco

### 3.3 `src/utils/permissions.js`

```javascript
/**
 * Normaliza o formato de permissões do backend (objeto) para um array plano de strings.
 *
 * Backend retorna:
 *   { clientes: { create: true, read: true, update: false, delete: false } }
 *
 * Frontend precisa:
 *   ["clientes.create", "clientes.read"]
 */
export function normalizePermissions(permissionsObj) {
  if (!permissionsObj || typeof permissionsObj !== "object") return [];

  // Se já for um array (fallback), retornar direto
  if (Array.isArray(permissionsObj)) return permissionsObj;

  const flat = [];

  for (const [module, actions] of Object.entries(permissionsObj)) {
    if (!actions || typeof actions !== "object") continue;

    for (const [action, allowed] of Object.entries(actions)) {
      if (allowed) {
        flat.push(`${module}.${action}`);
      }
    }
  }

  return flat;
}

/**
 * Verifica se uma permissão existe no array normalizado.
 */
export function checkPermission(permissions, permission) {
  if (!Array.isArray(permissions) || !permission) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

/**
 * Verifica se ao menos uma das permissões existe.
 */
export function checkAnyPermission(permissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) return false;
  return requiredPermissions.some((p) => checkPermission(permissions, p));
}

/**
 * Verifica se todas as permissões existem.
 */
export function checkAllPermissions(permissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) return false;
  return requiredPermissions.every((p) => checkPermission(permissions, p));
}
```

### 3.4 `src/services/api.js`

```javascript
import axios from "axios";
import tokenStorage from "../utils/tokenStorage";

// ---------------------------------------------------------------------------
// Evento customizado para sinalizar sessão expirada.
// O AuthContext escuta esse evento e faz o redirect via React Router,
// evitando window.location.href que causa reload completo.
// ---------------------------------------------------------------------------
const SESSION_EXPIRED_EVENT = "auth:session-expired";

export function onSessionExpired(callback) {
  window.addEventListener(SESSION_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback);
}

function emitSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

// ---------------------------------------------------------------------------
// Instância Axios
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Interceptor de REQUEST — injeta token automaticamente
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Interceptor de RESPONSE — trata 401 e 403
// ---------------------------------------------------------------------------
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Erro de rede / timeout
      return Promise.reject(error);
    }

    const { status, config } = error.response;

    // 401 — Token inválido ou sessão expirada
    // Ignora 401 na própria rota de login para não causar loop
    if (status === 401 && !config.url?.includes("/auth/login")) {
      tokenStorage.clear();

      if (!isRedirecting) {
        isRedirecting = true;
        emitSessionExpired();
        // Reseta o flag após breve intervalo para permitir futuras detecções
        setTimeout(() => {
          isRedirecting = false;
        }, 2000);
      }
    }

    // 403 — Sem permissão (não limpa a sessão, apenas rejeita)
    // A página deve tratar e mostrar mensagem apropriada

    return Promise.reject(error);
  }
);

export default api;
```

### 3.5 `src/services/authService.js`

```javascript
import api from "./api";

const authService = {
  /**
   * POST /auth/login
   * Retorna: { status, message, data: { token, tokenType, expiresIn, user } }
   */
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * POST /auth/logout (autenticado)
   */
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  /**
   * GET /auth/me (autenticado)
   * Retorna: { status, data: { id, name, email, phone, status, profile, session, permissions } }
   */
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * POST /auth/password-reset/request
   */
  requestPasswordReset: async (email) => {
    const response = await api.post("/auth/password-reset/request", { email });
    return response.data;
  },

  /**
   * POST /auth/password-reset/confirm
   */
  confirmPasswordReset: async (token, newPassword) => {
    const response = await api.post("/auth/password-reset/confirm", {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
```

### 3.6 `src/contexts/AuthContext.jsx`

```jsx
import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { onSessionExpired } from "../services/api";
import tokenStorage from "../utils/tokenStorage";
import {
  normalizePermissions,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
} from "../utils/permissions";

export const AuthContext = createContext(null);

/**
 * Prepara o objeto de usuário normalizado.
 * Converte permissions de objeto (backend) para array plano (frontend).
 */
function buildUser(rawUser) {
  if (!rawUser) return null;

  return {
    ...rawUser,
    permissions: normalizePermissions(rawUser.permissions),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // Recuperação de sessão: verifica se há token e busca perfil no backend
  // ------------------------------------------------------------------
  const loadUser = useCallback(async () => {
    if (!tokenStorage.hasToken()) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      setUser(buildUser(response.data));
    } catch {
      // Token inválido ou expirado
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ------------------------------------------------------------------
  // Listener para evento de sessão expirada (emitido pelo interceptor 401)
  // ------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
      navigate("/login", { replace: true, state: { sessionExpired: true } });
    });
    return unsubscribe;
  }, [navigate]);

  // ------------------------------------------------------------------
  // Login: autentica no backend, salva token e normaliza permissões
  // ------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user: rawUser } = response.data;

    tokenStorage.setToken(token);

    const normalizedUser = buildUser(rawUser);
    tokenStorage.setUser(normalizedUser);
    setUser(normalizedUser);

    return normalizedUser;
  }, []);

  // ------------------------------------------------------------------
  // Logout: limpa sessão no backend e localmente
  // ------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignora erro de logout no backend (token já pode ter expirado)
    } finally {
      tokenStorage.clear();
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // ------------------------------------------------------------------
  // Permissões
  // ------------------------------------------------------------------
  const hasPermission = useCallback(
    (permission) => checkPermission(user?.permissions, permission),
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions) => checkAnyPermission(user?.permissions, permissions),
    [user]
  );

  const hasAllPermissions = useCallback(
    (permissions) => checkAllPermissions(user?.permissions, permissions),
    [user]
  );

  // ------------------------------------------------------------------
  // Valor do contexto (memoizado)
  // ------------------------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshUser: loadUser,
    }),
    [user, loading, login, logout, hasPermission, hasAnyPermission, hasAllPermissions, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### 3.7 `src/hooks/useAuth.js`

```javascript
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
```

### 3.8 `src/hooks/usePermission.js`

```javascript
import { useAuth } from "./useAuth";

export function usePermission() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  const canRead = (module) => hasPermission(`${module}.read`);
  const canCreate = (module) => hasPermission(`${module}.create`);
  const canUpdate = (module) => hasPermission(`${module}.update`);
  const canDelete = (module) => hasPermission(`${module}.delete`);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
  };
}
```

### 3.9 `src/routes/ProtectedRoute.jsx`

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";

/**
 * Protege uma rota exigindo apenas autenticação.
 * Para proteção por permissão, use PermissionRoute.
 *
 * Aceita prop `permission` para retrocompatibilidade com rotas existentes.
 */
export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  if (loading) {
    return <Loading message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/acesso-negado" replace />;
  }

  return children;
}
```

### 3.10 `src/routes/PermissionRoute.jsx`

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";

/**
 * Protege uma rota exigindo permissão específica.
 *
 * Props:
 *  - permission: string (ex: "clientes.read") — permissão obrigatória
 *  - permissions: string[] — alternativa: qualquer uma dessas permissões
 *  - requireAll: boolean — se true, exige TODAS as permissions (default: false)
 *  - fallback: string — rota de redirect se não autorizado (default: "/acesso-negado")
 */
export default function PermissionRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = "/acesso-negado",
}) {
  const { isAuthenticated, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  if (loading) {
    return <Loading message="Verificando permissões..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permissão única
  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  // Múltiplas permissões
  if (permissions?.length) {
    const check = requireAll ? hasAllPermissions : hasAnyPermission;
    if (!check(permissions)) {
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
}
```

### 3.11 `src/routes/AppRoutes.jsx` (sem alteração)

O AppRoutes já usa `ProtectedRoute` com prop `permission` em todas as rotas privadas. A estrutura suporta o contrato atualizado sem necessidade de alteração:

```jsx
// Trecho relevante — cada rota é protegida por permissão:
{privateRoutes.map(({ path, element, permission }) => (
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
```

Se no futuro uma rota precisar de múltiplas permissões, basta trocar para:

```jsx
<PermissionRoute permissions={["vendas.read", "financeiro.read"]}>
  <RelatorioVendasFinanceiroPage />
</PermissionRoute>
```

### 3.12 `src/pages/Login/LoginPage.jsx`

```jsx
import { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionExpired = location.state?.sessionExpired;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Credenciais inválidas. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1B5E20",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              ERP Efrat Agro
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Acesse sua conta para continuar
            </Typography>
          </Box>

          {sessionExpired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sua sessão expirou. Faça login novamente.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
              autoComplete="email"
            />

            <TextField
              label="Senha"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <MdVisibilityOff size={20} />
                        ) : (
                          <MdVisibility size={20} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

## 4. Estratégia de Persistência de Sessão

```
Login bem-sucedido
  ↓
authService.login(email, password)
  ↓
Backend retorna { token, user: { ..., permissions: { modulo: { action: bool } } } }
  ↓
AuthContext normaliza permissions → array ["modulo.action", ...]
  ↓
tokenStorage.setToken(token)
tokenStorage.setUser(normalizedUser)
  ↓
Estado React: setUser(normalizedUser)
```

```
Refresh da página (F5)
  ↓
AuthContext.loadUser() detecta tokenStorage.hasToken()
  ↓
authService.getMe() → valida token no backend
  ↓
Se válido: setUser(buildUser(response.data))
Se inválido: tokenStorage.clear() → redirect /login
```

**Chaves no localStorage:**
- `efrat_token` — JWT puro
- `efrat_user` — Objeto do usuário com permissões já normalizadas

---

## 5. Estratégia dos Interceptors

### Request Interceptor

```
Toda requisição via api.*
  ↓
interceptor.request verifica tokenStorage.getToken()
  ↓
Se existe: adiciona header Authorization: Bearer <token>
Se não existe: requisição segue sem header (rotas públicas)
```

### Response Interceptor

```
Resposta recebida
  ├── 2xx → retorna normalmente
  ├── 401 (exceto /auth/login) → limpa tokenStorage, emite SESSION_EXPIRED_EVENT
  ├── 403 → rejeita promise (página trata)
  └── rede/timeout → rejeita promise
```

---

## 6. Estratégia para Tratamento de 401 e 403

### 401 — Sessão expirada ou token inválido

| Etapa | Ação |
|-------|------|
| 1 | Interceptor detecta status 401 |
| 2 | Ignora se a URL é `/auth/login` (evita loop) |
| 3 | Limpa `tokenStorage` |
| 4 | Emite evento `auth:session-expired` (apenas 1 vez via flag `isRedirecting`) |
| 5 | AuthContext escuta o evento, seta `user = null` |
| 6 | AuthContext redireciona para `/login` com `state.sessionExpired = true` |
| 7 | LoginPage exibe alerta "Sua sessão expirou" |

### 403 — Sem permissão

| Etapa | Ação |
|-------|------|
| 1 | Interceptor detecta status 403 |
| 2 | **Não limpa a sessão** (o usuário está autenticado, apenas não autorizado) |
| 3 | Rejeita a promise |
| 4 | A página trata o erro localmente (snackbar, redirect, etc.) |
| 5 | `ProtectedRoute` e `PermissionRoute` previnem acesso a rotas sem permissão |

---

## 7. Estratégia de Permissões no Frontend

### Normalização

O backend retorna permissões como objeto aninhado:
```json
{
  "clientes": { "create": true, "read": true, "update": true, "delete": false },
  "produtos": { "create": false, "read": true, "update": false, "delete": false }
}
```

O frontend normaliza para array plano:
```javascript
["clientes.create", "clientes.read", "clientes.update", "produtos.read"]
```

### API de verificação

| Função | Uso |
|--------|-----|
| `hasPermission("clientes.read")` | Permissão exata |
| `hasAnyPermission(["vendas.read", "financeiro.read"])` | Qualquer uma |
| `hasAllPermissions(["vendas.read", "vendas.create"])` | Todas |
| `canRead("clientes")` | Atalho para `.read` |
| `canCreate("vendas")` | Atalho para `.create` |
| `canUpdate("produtos")` | Atalho para `.update` |
| `canDelete("clientes")` | Atalho para `.delete` |

### Níveis de proteção

| Nível | Mecanismo |
|-------|-----------|
| **Rota inteira** | `ProtectedRoute permission="clientes.read"` |
| **Rota com múltiplas permissões** | `PermissionRoute permissions={["vendas.read", "financeiro.read"]}` |
| **Botão/ação** | `{canCreate("clientes") && <Button>Novo</Button>}` |
| **Coluna/campo** | `{canUpdate("produtos") && <IconButton>Editar</IconButton>}` |

---

## 8. Exemplo de Login Integrado

```jsx
// LoginPage.jsx — trecho do submit
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. AuthContext.login chama authService.login
    // 2. Backend valida credenciais, retorna token + user
    // 3. AuthContext normaliza permissões e salva no tokenStorage
    // 4. Estado React atualizado → isAuthenticated = true
    await login(email, password);

    // 5. Redireciona para dashboard
    navigate("/dashboard", { replace: true });
  } catch (err) {
    setError(err.response?.data?.message || "Credenciais inválidas.");
  } finally {
    setLoading(false);
  }
};
```

---

## 9. Exemplo de Proteção de Rota por Autenticação

```jsx
// Apenas exige que o usuário esteja logado
<Route
  element={
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  }
>
  <Route path="perfil" element={<PerfilPage />} />
</Route>
```

---

## 10. Exemplo de Proteção de Rota por Permissão

```jsx
// Permissão única (via ProtectedRoute)
<ProtectedRoute permission="clientes.read">
  <ClientesPage />
</ProtectedRoute>

// Múltiplas permissões (qualquer uma — via PermissionRoute)
<PermissionRoute permissions={["vendas.read", "financeiro.read"]}>
  <RelatorioPage />
</PermissionRoute>

// Múltiplas permissões (todas obrigatórias)
<PermissionRoute permissions={["auditoria.read", "relatorios.read"]} requireAll>
  <AuditoriaCompletaPage />
</PermissionRoute>
```

---

## 11. Exemplo de Uso em Páginas do Sistema

```jsx
// ClientesPage.jsx — trecho que usa permissões
import { usePermission } from "../../hooks/usePermission";

export default function ClientesPage() {
  const { canCreate, canUpdate, canDelete } = usePermission();

  return (
    <Box>
      <PageHeader
        title="Clientes"
        actions={
          canCreate("clientes") && (
            <Button onClick={handleNovo}>Novo Cliente</Button>
          )
        }
      />

      <DataTable
        columns={[
          // ... outras colunas
          {
            field: "acoes",
            renderCell: (row) => (
              <>
                {canUpdate("clientes") && (
                  <IconButton onClick={() => handleEdit(row)}>
                    <MdEdit />
                  </IconButton>
                )}
                {canDelete("clientes") && (
                  <IconButton onClick={() => handleDelete(row)}>
                    <MdDelete />
                  </IconButton>
                )}
              </>
            ),
          },
        ]}
      />
    </Box>
  );
}
```

---

## 12. Instrução de Integração com o Restante do Frontend

### Para consumir uma nova API em qualquer página:

```javascript
// 1. Crie o service (se não existir)
import api from "./api";
const meuService = {
  listar: (params) => api.get("/meu-modulo", { params }).then(r => r.data),
};

// 2. Na página, importe e use
import meuService from "../../services/meuService";
const response = await meuService.listar({ page: 1 });
```

### Para proteger um botão por permissão:

```jsx
import { usePermission } from "../../hooks/usePermission";
const { canCreate } = usePermission();
// ...
{canCreate("meu_modulo") && <Button>Criar</Button>}
```

### Para proteger uma rota nova:

```jsx
// Em AppRoutes.jsx, adicione ao array privateRoutes:
{ path: "meu-modulo", element: <MeuModuloPage />, permission: "meu_modulo.read" }
```

### Para configurar o ambiente:

```bash
cp .env.example .env
# Edite VITE_API_BASE_URL para apontar para o backend
```

### Checklist de integração:

- [ ] `.env` configurado com `VITE_API_BASE_URL`
- [ ] Backend rodando com CORS habilitado para a origem do frontend
- [ ] Rotas `/auth/login` e `/auth/me` respondendo
- [ ] Permissões retornadas no formato `{ modulo: { action: boolean } }`
- [ ] Frontend normaliza automaticamente via `normalizePermissions()`
