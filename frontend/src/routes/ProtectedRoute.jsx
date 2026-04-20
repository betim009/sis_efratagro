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
