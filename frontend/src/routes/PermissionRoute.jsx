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
