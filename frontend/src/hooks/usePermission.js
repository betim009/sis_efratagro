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
