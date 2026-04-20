const ACTION_TO_COLUMN = {
  create: "pode_criar",
  read: "pode_ler",
  update: "pode_atualizar",
  delete: "pode_excluir",
  inactivate: "pode_atualizar",
  block: "pode_atualizar"
};

const normalizePermission = (permission) => {
  const parts = permission.split(".");
  const action = parts.pop();
  const module = parts.join(".");

  return {
    module,
    action,
    column: ACTION_TO_COLUMN[action],
    resolvedAction:
      action === "inactivate" || action === "block" ? "update" : action
  };
};

const mapPermissions = (permissionRows) =>
  permissionRows.reduce((accumulator, row) => {
    accumulator[row.modulo] = {
      create: row.pode_criar,
      read: row.pode_ler,
      update: row.pode_atualizar,
      delete: row.pode_excluir
    };

    return accumulator;
  }, {});

const hasPermission = (permissions, permission) => {
  const normalized = normalizePermission(permission);

  if (!normalized.module || !normalized.action || !normalized.column) {
    return false;
  }

  return Boolean(
    permissions[normalized.module] &&
      permissions[normalized.module][normalized.resolvedAction]
  );
};

module.exports = {
  ACTION_TO_COLUMN,
  normalizePermission,
  mapPermissions,
  hasPermission
};
