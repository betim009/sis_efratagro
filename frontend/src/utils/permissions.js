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
