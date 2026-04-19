const { query } = require("../config/database");

const createAuditLog = async ({
  userId = null,
  tableName,
  recordId = null,
  action,
  previousData = null,
  newData = null,
  ipAddress = null,
  userAgent = null
}) => {
  await query(
    `
      INSERT INTO logs_auditoria (
        usuario_id,
        tabela_nome,
        registro_id,
        acao,
        dados_anteriores,
        dados_novos,
        ip_origem,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      userId,
      tableName,
      recordId,
      action,
      previousData ? JSON.stringify(previousData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress,
      userAgent
    ]
  );
};

module.exports = {
  createAuditLog
};
