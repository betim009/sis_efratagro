# Módulo de Logs de Auditoria — ERP Efrat Agro

## 1. Explicação Curta da Implementação

O módulo de auditoria é **transversal**: ele não é "mais um CRUD" — é uma infraestrutura de rastreabilidade que permeia todos os módulos do ERP. A estratégia adotada consiste em:

1. **Model centralizado** (`auditLogModel.js`) — mantém a função `createAuditLog()` já usada por 30+ pontos do sistema (retrocompatível) e adiciona funções de consulta com filtros dinâmicos.
2. **Service + Controller + Routes** — camada MSC para endpoints de consulta de logs.
3. **Helper reutilizável** (`auditHelper.js`) — funções de conveniência (`logCreate`, `logUpdate`, `logStatusChange`, `logInactivate`, `logAction`) que encapsulam padrões comuns sem poluir controllers.
4. **Validação dedicada** (`auditoriaValidation.js`) — enums de ações e módulos válidos, parse de filtros com sanitização.

### Decisões de Design

| Decisão | Justificativa |
|---------|--------------|
| `createAuditLog` continua no `auditLogModel` | 30+ chamadas existentes nos services — não faz sentido migrar |
| Log falho NÃO quebra o fluxo principal | `try/catch` silencioso no model — log no console, retorna `null` |
| `descricao` opcional adicionada | Permite contexto legível humano sem afetar chamadas existentes |
| IP e User-Agent registrados | Essenciais para investigação de segurança e governança |
| `before/after` via `dados_anteriores`/`dados_novos` (JSONB) | Permite diff de qualquer estrutura, sem schema rígido |
| Consulta com JOIN em `usuarios` | Retorna nome/email do usuário sem necessidade de segunda query |

---

## 2. Estratégia de Auditoria Transversal

### Como os módulos registram logs

Todos os **services** já chamam `auditLogModel.createAuditLog()` diretamente — essa é a estratégia principal e ela já funciona. O padrão é:

```javascript
// Dentro de qualquer service (ex: clienteService.js)
const auditLogModel = require("../models/auditLogModel");

// Após operação de negócio:
await auditLogModel.createAuditLog({
  userId,
  tableName: "clientes",
  recordId: cliente.id,
  action: "UPDATE",
  previousData: clienteAnterior,
  newData: dadosAtualizados,
  ipAddress: request.ip,
  userAgent: request.get("user-agent")
});
```

### Helper opcional para padronização

Para novos módulos ou refactoring gradual, o `auditHelper.js` oferece atalhos:

```javascript
const auditHelper = require("../utils/auditHelper");

// Criação
await auditHelper.logCreate({
  userId,
  tableName: "clientes",
  recordId: novoCliente.id,
  newData: novoCliente,
  request
});

// Atualização com before/after
await auditHelper.logUpdate({
  userId,
  tableName: "clientes",
  recordId: cliente.id,
  previousData: clienteAnterior,
  newData: dadosAtualizados,
  request
});

// Mudança de status
await auditHelper.logStatusChange({
  userId,
  tableName: "fretes",
  recordId: frete.id,
  previousStatus: "PENDENTE",
  newStatus: "EM_TRANSITO",
  request
});

// Inativação
await auditHelper.logInactivate({
  userId,
  tableName: "fornecedores",
  recordId: fornecedor.id,
  previousStatus: "ATIVO",
  request
});

// Ação genérica
await auditHelper.logAction({
  userId,
  tableName: "pagamentos",
  recordId: pagamento.id,
  action: "PAYMENT_REGISTER",
  newData: { valor: 1500.00, metodo: "BOLETO" },
  descricao: "Pagamento registrado para duplicata #123",
  request
});
```

### Quem chama quem

```
Controller (magro)
  └── Service (regra de negócio)
        ├── Model de negócio (CRUD)
        └── auditLogModel.createAuditLog()  ← registro de auditoria
              ou auditHelper.logXxx()        ← alternativa com conveniência
```

**Decisão**: a lógica de auditoria fica **nos services**, nunca nos controllers. O controller permanece magro, delegando tudo ao service.

---

## 3. Estrutura dos Arquivos

```
backend/src/
├── models/
│   └── auditLogModel.js        ← Evoluído: createAuditLog (retrocompat) + findById + listLogs + getMetricas
├── services/
│   └── auditoriaService.js     ← Novo: camada de serviço para consultas
├── controllers/
│   └── auditoriaController.js  ← Novo: 7 handlers finos
├── routes/
│   └── auditoriaRoutes.js      ← Novo: 7 rotas GET protegidas
├── utils/
│   ├── auditoriaValidation.js  ← Novo: enums, parse de filtros, sanitização
│   └── auditHelper.js          ← Novo: funções de conveniência para registro
└── database/
    └── migrations.sql          ← Evoluído: ALTER TABLE com descricao, CHECK expandido, índice composto
```

---

## 4. Código Completo dos Arquivos

### 4.1 `src/database/migrations.sql` (evolução)

```sql
-- ╔══════════════════════════════════════════════════════════════════╗
-- ║ PROMPT 15 — Evolução da tabela logs_auditoria                   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Campo de descrição legível
ALTER TABLE logs_auditoria
  ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Expandir CHECK de ação para cobrir novas ações do ERP
ALTER TABLE logs_auditoria
  DROP CONSTRAINT IF EXISTS logs_auditoria_acao_check;

ALTER TABLE logs_auditoria
  ADD CONSTRAINT logs_auditoria_acao_check
  CHECK (acao IN (
    'INSERT', 'UPDATE', 'DELETE',
    'INACTIVATE', 'STATUS_CHANGE',
    'LOGIN', 'LOGOUT',
    'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM',
    'PAYMENT_REGISTER', 'STOCK_MOVEMENT', 'SALE_CONFIRM',
    'DELIVERY_STATUS_CHANGE',
    'FREIGHT_REAL_COST_UPDATE', 'FREIGHT_LINK_DELIVERY', 'FREIGHT_LINK_VEHICLE',
    'MAINTENANCE_STATUS_CHANGE', 'VEHICLE_STATUS_CHANGE'
  ));

-- Ampliar tamanho do campo acao para novos tipos
ALTER TABLE logs_auditoria
  ALTER COLUMN acao TYPE VARCHAR(40);

-- Índice composto para consultas por módulo + registro
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_tabela_registro
  ON logs_auditoria (tabela_nome, registro_id);
```

### 4.2 `src/utils/auditoriaValidation.js`

```javascript
const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_ACOES = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "INACTIVATE",
  "STATUS_CHANGE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET_REQUEST",
  "PASSWORD_RESET_CONFIRM",
  "PAYMENT_REGISTER",
  "STOCK_MOVEMENT",
  "SALE_CONFIRM",
  "DELIVERY_STATUS_CHANGE",
  "FREIGHT_REAL_COST_UPDATE",
  "FREIGHT_LINK_DELIVERY",
  "FREIGHT_LINK_VEHICLE",
  "MAINTENANCE_STATUS_CHANGE",
  "VEHICLE_STATUS_CHANGE"
];

const VALID_MODULOS = [
  "usuarios",
  "fornecedores",
  "clientes",
  "produtos",
  "locais_estoque",
  "estoques",
  "vendas",
  "itens_venda",
  "duplicatas",
  "pagamentos",
  "veiculos",
  "manutencoes",
  "fretes",
  "tabelas_frete",
  "entregas",
  "historico_entregas",
  "movimentacoes_estoque",
  "sessoes_usuario",
  "tokens_reset_senha",
  "perfis_acesso",
  "perfil_permissoes"
];

const isValidUuid = (value) => UUID_PATTERN.test(String(value || ""));

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const sanitizeString = (value) => {
  if (value === undefined || value === null) return null;
  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

const parseLogFilters = (queryParams) => {
  const filters = {};

  if (queryParams.usuarioId) {
    if (!isValidUuid(queryParams.usuarioId)) {
      throw new AppError("usuarioId invalido", 400);
    }
    filters.usuarioId = queryParams.usuarioId;
  }

  if (queryParams.modulo) {
    const modulo = sanitizeString(queryParams.modulo);
    if (modulo && !VALID_MODULOS.includes(modulo.toLowerCase())) {
      throw new AppError(
        `Modulo invalido. Use: ${VALID_MODULOS.join(", ")}`,
        400
      );
    }
    filters.modulo = modulo ? modulo.toLowerCase() : null;
  }

  if (queryParams.entidade) {
    filters.entidade = sanitizeString(queryParams.entidade);
  }

  if (queryParams.entidadeId) {
    if (!isValidUuid(queryParams.entidadeId)) {
      throw new AppError("entidadeId invalido", 400);
    }
    filters.entidadeId = queryParams.entidadeId;
  }

  if (queryParams.acao) {
    const acao = String(queryParams.acao).toUpperCase();
    if (!VALID_ACOES.includes(acao)) {
      throw new AppError(
        `Acao invalida. Use: ${VALID_ACOES.join(", ")}`,
        400
      );
    }
    filters.acao = acao;
  }

  if (queryParams.dataInicio) {
    if (!isValidDate(queryParams.dataInicio)) {
      throw new AppError("dataInicio invalida. Use formato YYYY-MM-DD", 400);
    }
    filters.dataInicio = queryParams.dataInicio;
  }

  if (queryParams.dataFim) {
    if (!isValidDate(queryParams.dataFim)) {
      throw new AppError("dataFim invalida. Use formato YYYY-MM-DD", 400);
    }
    filters.dataFim = queryParams.dataFim;
  }

  if (filters.dataInicio && filters.dataFim) {
    if (new Date(filters.dataInicio) > new Date(filters.dataFim)) {
      throw new AppError("dataInicio nao pode ser posterior a dataFim", 400);
    }
  }

  const page = Number(queryParams.page);
  const limit = Number(queryParams.limit);

  filters.page = (!Number.isNaN(page) && page >= 1) ? Math.floor(page) : 1;
  filters.limit = (!Number.isNaN(limit) && limit >= 1 && limit <= 200) ? Math.floor(limit) : 50;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

module.exports = {
  VALID_ACOES,
  VALID_MODULOS,
  isValidUuid,
  sanitizeString,
  parseLogFilters
};
```

### 4.3 `src/models/auditLogModel.js`

```javascript
const { query } = require("../config/database");

// ─── SELECT base para consultas ────────────────────────────────────

const logSelect = `
  SELECT
    la.id,
    la.usuario_id,
    u.nome AS usuario_nome,
    u.email AS usuario_email,
    la.tabela_nome,
    la.registro_id,
    la.acao,
    la.dados_anteriores,
    la.dados_novos,
    la.descricao,
    la.ip_origem,
    la.user_agent,
    la.criado_em AS created_at
  FROM logs_auditoria la
  LEFT JOIN usuarios u ON u.id = la.usuario_id
`;

// ─── CREATE (compatível com todos os services existentes) ──────────

const createAuditLog = async ({
  userId = null,
  tableName,
  recordId = null,
  action,
  previousData = null,
  newData = null,
  ipAddress = null,
  userAgent = null,
  descricao = null
}) => {
  try {
    const result = await query(
      `
        INSERT INTO logs_auditoria (
          usuario_id,
          tabela_nome,
          registro_id,
          acao,
          dados_anteriores,
          dados_novos,
          descricao,
          ip_origem,
          user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, criado_em AS created_at
      `,
      [
        userId,
        tableName,
        recordId,
        action,
        previousData ? JSON.stringify(previousData) : null,
        newData ? JSON.stringify(newData) : null,
        descricao,
        ipAddress,
        userAgent
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("[auditoria] Falha ao registrar log:", error.message);
    return null;
  }
};

// ─── FIND BY ID ────────────────────────────────────────────────────

const findById = async (id) => {
  const result = await query(`${logSelect} WHERE la.id = $1`, [id]);
  return result.rows[0] || null;
};

// ─── LIST COM FILTROS DINÂMICOS ────────────────────────────────────

const listLogs = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.usuarioId) {
    conditions.push(`la.usuario_id = $${idx++}`);
    params.push(filters.usuarioId);
  }

  if (filters.modulo) {
    conditions.push(`la.tabela_nome = $${idx++}`);
    params.push(filters.modulo);
  }

  if (filters.entidade) {
    conditions.push(`la.tabela_nome = $${idx++}`);
    params.push(filters.entidade);
  }

  if (filters.entidadeId) {
    conditions.push(`la.registro_id = $${idx++}`);
    params.push(filters.entidadeId);
  }

  if (filters.acao) {
    conditions.push(`la.acao = $${idx++}`);
    params.push(filters.acao);
  }

  if (filters.dataInicio) {
    conditions.push(`la.criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`la.criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    ${logSelect}
    ${where}
    ORDER BY la.criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM logs_auditoria la ${where}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return {
    logs: dataResult.rows,
    total: Number(countResult.rows[0].total)
  };
};

// ─── MÉTRICAS PARA RELATÓRIOS ──────────────────────────────────────

const getMetricas = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `
      SELECT
        COUNT(*) AS total_logs,
        COUNT(DISTINCT usuario_id) AS usuarios_distintos,
        COUNT(DISTINCT tabela_nome) AS modulos_distintos
      FROM logs_auditoria
      ${where}
    `,
    params
  );

  const porAcao = await query(
    `
      SELECT acao, COUNT(*) AS total
      FROM logs_auditoria
      ${where}
      GROUP BY acao
      ORDER BY total DESC
    `,
    params
  );

  const porModulo = await query(
    `
      SELECT tabela_nome AS modulo, COUNT(*) AS total
      FROM logs_auditoria
      ${where}
      GROUP BY tabela_nome
      ORDER BY total DESC
      LIMIT 20
    `,
    params
  );

  return {
    resumo: result.rows[0],
    por_acao: porAcao.rows,
    por_modulo: porModulo.rows
  };
};

module.exports = {
  createAuditLog,
  findById,
  listLogs,
  getMetricas
};
```

### 4.4 `src/services/auditoriaService.js`

```javascript
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  isValidUuid,
  parseLogFilters
} = require("../utils/auditoriaValidation");

const getLogById = async (id) => {
  if (!isValidUuid(id)) {
    throw new AppError("ID de log invalido", 400);
  }

  const log = await auditLogModel.findById(id);
  if (!log) {
    throw new AppError("Log de auditoria nao encontrado", 404);
  }

  return log;
};

const listLogs = async (queryParams) => {
  const filters = parseLogFilters(queryParams);
  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByUsuario = async (usuarioId, queryParams) => {
  if (!isValidUuid(usuarioId)) {
    throw new AppError("usuarioId invalido", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.usuarioId = usuarioId;

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByModulo = async (modulo, queryParams) => {
  if (!modulo || !modulo.trim()) {
    throw new AppError("Modulo obrigatorio", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.modulo = modulo.trim().toLowerCase();

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByEntidade = async (entidade, entidadeId, queryParams) => {
  if (!entidade || !entidade.trim()) {
    throw new AppError("Entidade obrigatoria", 400);
  }

  if (!isValidUuid(entidadeId)) {
    throw new AppError("entidadeId invalido", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.entidade = entidade.trim().toLowerCase();
  filters.entidadeId = entidadeId;

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByAcao = async (acao, queryParams) => {
  if (!acao || !acao.trim()) {
    throw new AppError("Acao obrigatoria", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.acao = acao.trim().toUpperCase();

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const getMetricas = async (queryParams) => {
  const filters = parseLogFilters(queryParams);
  return auditLogModel.getMetricas(filters);
};

module.exports = {
  getLogById,
  listLogs,
  listLogsByUsuario,
  listLogsByModulo,
  listLogsByEntidade,
  listLogsByAcao,
  getMetricas
};
```

### 4.5 `src/controllers/auditoriaController.js`

```javascript
const auditoriaService = require("../services/auditoriaService");

const listLogs = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogs(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getLogById = async (request, response, next) => {
  try {
    const log = await auditoriaService.getLogById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: log
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByUsuario = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByUsuario(
      request.params.usuarioId,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByModulo = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByModulo(
      request.params.modulo,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByEntidade = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByEntidade(
      request.params.entidade,
      request.params.entidadeId,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByAcao = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByAcao(
      request.params.acao,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getMetricas = async (request, response, next) => {
  try {
    const result = await auditoriaService.getMetricas(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listLogs,
  getLogById,
  listLogsByUsuario,
  listLogsByModulo,
  listLogsByEntidade,
  listLogsByAcao,
  getMetricas
};
```

### 4.6 `src/routes/auditoriaRoutes.js`

```javascript
const express = require("express");

const auditoriaController = require("../controllers/auditoriaController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Métricas de auditoria (antes das rotas com parâmetros)
router.get(
  "/logs/metricas",
  permissionMiddleware("auditoria.read", "auditoria.read.all"),
  auditoriaController.getMetricas
);

// Logs por usuário
router.get(
  "/logs/usuario/:usuarioId",
  permissionMiddleware("auditoria.read", "auditoria.read.by_user"),
  auditoriaController.listLogsByUsuario
);

// Logs por módulo (tabela)
router.get(
  "/logs/modulo/:modulo",
  permissionMiddleware("auditoria.read", "auditoria.read.by_module"),
  auditoriaController.listLogsByModulo
);

// Logs por entidade e ID de registro
router.get(
  "/logs/entidade/:entidade/:entidadeId",
  permissionMiddleware("auditoria.read"),
  auditoriaController.listLogsByEntidade
);

// Logs por ação
router.get(
  "/logs/acao/:acao",
  permissionMiddleware("auditoria.read"),
  auditoriaController.listLogsByAcao
);

// Log específico por ID
router.get(
  "/logs/:id",
  permissionMiddleware("auditoria.read"),
  auditoriaController.getLogById
);

// Listagem geral com filtros via query string
router.get(
  "/logs",
  permissionMiddleware("auditoria.read"),
  auditoriaController.listLogs
);

module.exports = router;
```

### 4.7 `src/utils/auditHelper.js`

```javascript
const auditLogModel = require("../models/auditLogModel");

const getRequestMetadata = (request) => ({
  ipAddress: request ? request.ip : null,
  userAgent: request ? request.get("user-agent") || null : null
});

const logCreate = async ({
  userId,
  tableName,
  recordId,
  newData,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "INSERT",
    newData,
    descricao: descricao || `Registro criado em ${tableName}`,
    ...metadata
  });
};

const logUpdate = async ({
  userId,
  tableName,
  recordId,
  previousData,
  newData,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "UPDATE",
    previousData,
    newData,
    descricao: descricao || `Registro atualizado em ${tableName}`,
    ...metadata
  });
};

const logInactivate = async ({
  userId,
  tableName,
  recordId,
  previousStatus,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "INACTIVATE",
    previousData: { status: previousStatus },
    newData: { status: "INATIVO" },
    descricao: descricao || `Registro inativado em ${tableName}`,
    ...metadata
  });
};

const logStatusChange = async ({
  userId,
  tableName,
  recordId,
  previousStatus,
  newStatus,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "STATUS_CHANGE",
    previousData: { status: previousStatus },
    newData: { status: newStatus },
    descricao: descricao || `Status alterado de ${previousStatus} para ${newStatus} em ${tableName}`,
    ...metadata
  });
};

const logAction = async ({
  userId,
  tableName,
  recordId,
  action,
  previousData = null,
  newData = null,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action,
    previousData,
    newData,
    descricao,
    ...metadata
  });
};

module.exports = {
  getRequestMetadata,
  logCreate,
  logUpdate,
  logInactivate,
  logStatusChange,
  logAction
};
```

### 4.8 `src/routes/index.js` (trecho atualizado)

```javascript
const freteRoutes = require("./freteRoutes");
const auditoriaRoutes = require("./auditoriaRoutes");

// ...

router.use("/fretes", freteRoutes);
router.use("/auditoria", auditoriaRoutes);
```

---

## 5. Estratégia para Registrar Logs sem Poluir Controllers

| Regra | Como é aplicada |
|-------|----------------|
| Controller magro | O controller apenas extrai params/query/body e delega ao service |
| Registro no service | Toda chamada a `auditLogModel.createAuditLog()` ocorre dentro do service, após a operação de negócio |
| Helper opcional | `auditHelper.js` oferece funções de conveniência — não é obrigatório, é uma camada de padronização gradual |
| Falha silenciosa | `createAuditLog` tem `try/catch` interno — se o log falhar, a operação principal continua |
| Sem middleware genérico | Não usamos middleware de auditoria genérico (que logar tudo indiscriminadamente) — cada service decide o que registrar |

**Justificativa da não adoção de middleware genérico**: um middleware que loga todas as requests criaria ruído excessivo (GETs de listagem, health checks, etc.) e não teria acesso ao estado before/after da entidade. A decisão de logar nos services garante que apenas operações significativas sejam registradas com contexto adequado.

---

## 6. Rotas Protegidas com Autenticação e Autorização

| Método | Rota | Permissões | Handler |
|--------|------|-----------|---------|
| GET | `/auditoria/logs` | `auditoria.read` | `listLogs` |
| GET | `/auditoria/logs/metricas` | `auditoria.read`, `auditoria.read.all` | `getMetricas` |
| GET | `/auditoria/logs/usuario/:usuarioId` | `auditoria.read`, `auditoria.read.by_user` | `listLogsByUsuario` |
| GET | `/auditoria/logs/modulo/:modulo` | `auditoria.read`, `auditoria.read.by_module` | `listLogsByModulo` |
| GET | `/auditoria/logs/entidade/:entidade/:entidadeId` | `auditoria.read` | `listLogsByEntidade` |
| GET | `/auditoria/logs/acao/:acao` | `auditoria.read` | `listLogsByAcao` |
| GET | `/auditoria/logs/:id` | `auditoria.read` | `getLogById` |

Todas as rotas exigem `authMiddleware` (JWT válido) + permissões específicas via `permissionMiddleware`.

---

## 7. Validações de Filtros

| Filtro | Tipo | Validação |
|--------|------|-----------|
| `usuarioId` | UUID v4 | Regex UUID |
| `modulo` | String | Deve estar em `VALID_MODULOS` (21 tabelas) |
| `entidade` | String | Sanitização (trim, null se vazio) |
| `entidadeId` | UUID v4 | Regex UUID |
| `acao` | String | Deve estar em `VALID_ACOES` (18 ações) |
| `dataInicio` | Date | Formato `YYYY-MM-DD`, validação de data real |
| `dataFim` | Date | Formato `YYYY-MM-DD`, validação de data real |
| `page` | Number | >= 1, default 1 |
| `limit` | Number | 1-200, default 50 |
| Combinação `dataInicio` + `dataFim` | - | `dataInicio` não pode ser posterior a `dataFim` |

---

## 8. Exemplos de Uso em Módulos

### 8.1 Clientes (UPDATE com before/after)

```javascript
// src/services/clienteService.js — trecho existente (já funciona)
const clienteAnterior = await clienteModel.findById(id);
const clienteAtualizado = await clienteModel.update(id, dados);

await auditLogModel.createAuditLog({
  userId,
  tableName: "clientes",
  recordId: id,
  action: "UPDATE",
  previousData: clienteAnterior,
  newData: clienteAtualizado,
  ipAddress: request.ip,
  userAgent: request.get("user-agent")
});
```

### 8.2 Vendas (SALE_CONFIRM com helper)

```javascript
// Exemplo com auditHelper:
const auditHelper = require("../utils/auditHelper");

await auditHelper.logAction({
  userId,
  tableName: "vendas",
  recordId: venda.id,
  action: "SALE_CONFIRM",
  newData: { total: venda.total, itens: venda.itens.length },
  descricao: `Venda #${venda.id} confirmada com ${venda.itens.length} itens`,
  request
});
```

### 8.3 Pagamentos (PAYMENT_REGISTER com helper)

```javascript
await auditHelper.logAction({
  userId,
  tableName: "pagamentos",
  recordId: pagamento.id,
  action: "PAYMENT_REGISTER",
  newData: { valor: pagamento.valor, metodo: pagamento.metodo_pagamento },
  descricao: `Pagamento de R$${pagamento.valor} registrado via ${pagamento.metodo_pagamento}`,
  request
});
```

---

## 9. Exemplo de Resposta da API

### GET /auditoria/logs?modulo=clientes&acao=UPDATE&page=1&limit=10

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "usuario_id": "11111111-1111-1111-1111-111111111111",
        "usuario_nome": "João Administrador",
        "usuario_email": "joao@efratagro.com",
        "tabela_nome": "clientes",
        "registro_id": "22222222-2222-2222-2222-222222222222",
        "acao": "UPDATE",
        "dados_anteriores": {
          "nome": "Fazenda Velha",
          "telefone": "11999990000"
        },
        "dados_novos": {
          "nome": "Fazenda Nova",
          "telefone": "11999991111"
        },
        "descricao": "Registro atualizado em clientes",
        "ip_origem": "192.168.1.100",
        "user_agent": "Mozilla/5.0 ...",
        "created_at": "2025-01-15T14:32:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 47,
      "total_pages": 5
    }
  }
}
```

### GET /auditoria/logs/metricas?dataInicio=2025-01-01&dataFim=2025-01-31

```json
{
  "status": "success",
  "data": {
    "resumo": {
      "total_logs": "1523",
      "usuarios_distintos": "8",
      "modulos_distintos": "12"
    },
    "por_acao": [
      { "acao": "UPDATE", "total": "612" },
      { "acao": "INSERT", "total": "423" },
      { "acao": "LOGIN", "total": "189" },
      { "acao": "PAYMENT_REGISTER", "total": "87" }
    ],
    "por_modulo": [
      { "modulo": "clientes", "total": "312" },
      { "modulo": "produtos", "total": "278" },
      { "modulo": "vendas", "total": "201" }
    ]
  }
}
```

---

## 10. Estratégia para Before/After

| Tipo de Ação | Before (`dados_anteriores`) | After (`dados_novos`) |
|-------------|---------------------------|----------------------|
| INSERT | `null` | Dados completos do novo registro |
| UPDATE | Estado completo antes da alteração | Dados atualizados |
| INACTIVATE | `{ status: "ATIVO" }` | `{ status: "INATIVO" }` |
| STATUS_CHANGE | `{ status: "anterior" }` | `{ status: "novo" }` |
| DELETE | Dados completos do registro removido | `null` |
| LOGIN / LOGOUT | `null` | `null` (metadados no IP e user_agent) |
| PAYMENT_REGISTER | `null` | Dados do pagamento |
| STOCK_MOVEMENT | Estoque anterior | Estoque atual |
| SALE_CONFIRM | `null` | Resumo da venda |

**Decisão**: o before/after é armazenado como JSONB, permitindo guardar qualquer estrutura sem schema rígido. Isso torna o sistema flexível para novos módulos sem alteração de schema.

---

## 11. Estrutura Preparada para Relatórios e Segurança

### Para Relatórios Internos

O endpoint `GET /auditoria/logs/metricas` retorna:
- Total de logs no período
- Quantidade de usuários distintos que operaram
- Quantidade de módulos distintos afetados
- Distribuição por tipo de ação
- Distribuição por módulo

Esses dados podem ser consumidos pelo módulo de Relatórios (Prompt 13) para gerar PDFs/Excel de auditoria.

### Para Segurança

- IP de origem e User-Agent registrados em cada log
- Filtro por usuário permite investigar atividade suspeita
- Filtro por período permite análise temporal
- Ações de autenticação (LOGIN, LOGOUT, PASSWORD_RESET_*) são rastreadas
- Permissões granulares (`auditoria.read.all`, `auditoria.read.by_user`, `auditoria.read.by_module`) controlam quem pode consultar logs

---

## 12. Instrução de Integração com o Backend

### Para registrar logs em um novo módulo:

1. Importe o model ou o helper no service:
   ```javascript
   const auditLogModel = require("../models/auditLogModel");
   // ou
   const auditHelper = require("../utils/auditHelper");
   ```

2. Após cada operação de negócio relevante, registre o log:
   ```javascript
   await auditLogModel.createAuditLog({
     userId,
     tableName: "nome_da_tabela",
     recordId: registro.id,
     action: "INSERT", // ou UPDATE, INACTIVATE, etc.
     previousData: null, // objeto antes (se UPDATE/INACTIVATE)
     newData: registro,  // objeto depois (se INSERT/UPDATE)
     ipAddress: request.ip,
     userAgent: request.get("user-agent")
   });
   ```

3. Se preferir o helper:
   ```javascript
   await auditHelper.logCreate({ userId, tableName: "xxx", recordId, newData, request });
   ```

4. Adicione novas ações em `VALID_ACOES` (em `auditoriaValidation.js`) e no CHECK da migration se necessário.

5. Adicione novos módulos em `VALID_MODULOS` se criar tabelas novas.

### Para rodar a migration de evolução:

Execute o bloco SQL de evolução (`ALTER TABLE`, `DROP/ADD CONSTRAINT`, `CREATE INDEX`) no PostgreSQL. Os comandos são idempotentes (`IF NOT EXISTS`, `IF EXISTS`).

---

## Permissões a cadastrar

| Permissão | Descrição |
|-----------|-----------|
| `auditoria.read` | Consultar logs de auditoria |
| `auditoria.read.all` | Consultar métricas gerais |
| `auditoria.read.by_user` | Consultar logs por usuário |
| `auditoria.read.by_module` | Consultar logs por módulo |
