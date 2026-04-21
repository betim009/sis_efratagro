/* eslint-disable react-refresh/only-export-components */
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
    const initializeSession = async () => {
      await loadUser();
    };

    void initializeSession();
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
