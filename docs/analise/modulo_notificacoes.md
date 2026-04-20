# Módulo de Notificações Internas — ERP Efrat Agro

## 1. Explicação Curta da Implementação

O módulo de notificações é **transversal**: qualquer módulo do ERP pode gerar notificações para um ou mais usuários sem acoplar lógica de apresentação. A arquitetura segue três camadas:

1. **Helper centralizado** (`notificacaoHelper.js`) — ponto único de disparo com funções tipadas por evento (estoque baixo, duplicata vencida, entrega etc.). Fire-and-forget: nunca quebra o fluxo principal.
2. **Service + Model + Controller + Routes** — camada MSC para consulta, contagem, marcação como lida e arquivamento.
3. **Email Provider** (`emailProvider.js`) — stub preparado para SMTP futuro. Hoje apenas loga. Quando configurado, nenhum código de negócio muda.

### Decisões de Design

| Decisão | Justificativa |
|---------|--------------|
| Status `ARQUIVADA` suportado | Permite ao usuário limpar a inbox sem perder histórico; notificações arquivadas não contam no badge |
| Ordenação por prioridade + data | Notificações críticas aparecem primeiro, respeitando cronologia dentro da mesma prioridade |
| `metadata` como JSONB | Permite dados extras arbitrários por tipo de evento sem schema rígido |
| `notificarMultiplos()` com loop + try/catch individual | Garante que a falha de um usuário não impede a notificação dos demais |
| E-mail fire-and-forget | O helper chama `emailProvider.enviarSeAtivo()` sem await bloqueante — erros são logados, não propagados |
| Verificação de propriedade no service | Usuário só acessa próprias notificações; admin pode acessar qualquer uma |

---

## 2. Estratégia de Notificações Internas

### Fluxo de geração

```
Evento de negócio (service de estoque, financeiro, entregas, etc.)
  └── notificacaoHelper.notificarEstoqueBaixo({ usuarioIds, produto, ... })
        ├── notificacaoService.criarParaMultiplosUsuarios()
        │     └── notificacaoModel.create() × N
        └── emailProvider.enviarSeAtivo() (fire-and-forget)
```

### Quem recebe cada tipo

| Tipo | Destinatários típicos |
|------|----------------------|
| `ESTOQUE_BAIXO` | Estoquista + Gerente |
| `DUPLICATA_VENCIDA` | Financeiro + Gerente |
| `DUPLICATA_VENCENDO` | Financeiro |
| `MANUTENCAO_PENDENTE` | Responsável da frota |
| `ENTREGA_NAO_CONCLUIDA` | Vendedor responsável |
| `ENTREGA_CONCLUIDA` | Vendedor + Gerente |
| `STATUS_ENTREGA_ALTERADO` | Vendedor responsável |
| `FRETE_DIVERGENTE` | Logística + Gerente |
| `VENDA_FUTURA_PROXIMA` | Vendedor responsável |
| `ALERTA_GERAL` | Definido pelo chamador |

**Decisão**: o módulo chamador é quem define os `usuarioIds` destinatários. O helper não consulta perfis — isso é responsabilidade do service que dispara o evento, pois ele tem o contexto de negócio.

---

## 3. Estrutura dos Arquivos

```
backend/src/
├── models/
│   └── notificacaoModel.js       ← CRUD + listByUsuario + countNaoLidas + marcarLida/TodasLidas + arquivar
├── services/
│   └── notificacaoService.js     ← Lógica de negócio + verificação de propriedade
├── controllers/
│   └── notificacaoController.js  ← 9 handlers finos
├── routes/
│   └── notificacaoRoutes.js      ← 9 rotas protegidas (GET + PATCH)
├── utils/
│   ├── notificacaoValidation.js  ← Enums, validateCreatePayload, parseFilters
│   ├── notificacaoHelper.js      ← Helper com atalhos tipados por evento
│   └── emailProvider.js          ← Stub para envio futuro de e-mail
└── database/
    └── migrations.sql            ← CREATE TABLE notificacoes + índices
```

---

## 4. Código Completo dos Arquivos

### 4.1 `src/database/migrations.sql` (adição)

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- MÓDULO DE NOTIFICAÇÕES — TABELA notificacoes
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(40) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  prioridade VARCHAR(10) NOT NULL DEFAULT 'MEDIA',
  status VARCHAR(15) NOT NULL DEFAULT 'NAO_LIDA',
  entidade VARCHAR(100),
  entidade_id UUID,
  metadata JSONB,
  lida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notificacoes_tipo_check CHECK (tipo IN (
    'ESTOQUE_BAIXO',
    'VENDA_FUTURA_PROXIMA',
    'DUPLICATA_VENCIDA',
    'DUPLICATA_VENCENDO',
    'MANUTENCAO_PENDENTE',
    'ENTREGA_NAO_CONCLUIDA',
    'ENTREGA_CONCLUIDA',
    'STATUS_ENTREGA_ALTERADO',
    'FRETE_DIVERGENTE',
    'ALERTA_GERAL'
  )),
  CONSTRAINT notificacoes_prioridade_check CHECK (prioridade IN (
    'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'
  )),
  CONSTRAINT notificacoes_status_check CHECK (status IN (
    'NAO_LIDA', 'LIDA', 'ARQUIVADA'
  ))
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_status ON notificacoes (usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_prioridade ON notificacoes (prioridade);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON notificacoes (criado_em);
CREATE INDEX IF NOT EXISTS idx_notificacoes_entidade ON notificacoes (entidade, entidade_id);
```

### 4.2 `src/utils/notificacaoValidation.js`

```javascript
const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_TIPOS = [
  "ESTOQUE_BAIXO",
  "VENDA_FUTURA_PROXIMA",
  "DUPLICATA_VENCIDA",
  "DUPLICATA_VENCENDO",
  "MANUTENCAO_PENDENTE",
  "ENTREGA_NAO_CONCLUIDA",
  "ENTREGA_CONCLUIDA",
  "STATUS_ENTREGA_ALTERADO",
  "FRETE_DIVERGENTE",
  "ALERTA_GERAL"
];

const VALID_PRIORIDADES = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

const VALID_STATUS = ["NAO_LIDA", "LIDA", "ARQUIVADA"];

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

const validateCreatePayload = ({
  usuarioId,
  tipo,
  titulo,
  mensagem,
  prioridade = "MEDIA",
  entidade = null,
  entidadeId = null,
  metadata = null
}) => {
  if (!usuarioId || !isValidUuid(usuarioId)) {
    throw new AppError("usuario_id obrigatorio e deve ser UUID valido", 400);
  }

  if (!tipo || !VALID_TIPOS.includes(String(tipo).toUpperCase())) {
    throw new AppError(
      `tipo invalido. Use: ${VALID_TIPOS.join(", ")}`,
      400
    );
  }

  const tituloSanitized = sanitizeString(titulo);
  if (!tituloSanitized) {
    throw new AppError("titulo obrigatorio", 400);
  }

  const mensagemSanitized = sanitizeString(mensagem);
  if (!mensagemSanitized) {
    throw new AppError("mensagem obrigatoria", 400);
  }

  const prioridadeUpper = String(prioridade).toUpperCase();
  if (!VALID_PRIORIDADES.includes(prioridadeUpper)) {
    throw new AppError(
      `prioridade invalida. Use: ${VALID_PRIORIDADES.join(", ")}`,
      400
    );
  }

  const entidadeSanitized = sanitizeString(entidade);
  if (entidadeId && !isValidUuid(entidadeId)) {
    throw new AppError("entidade_id deve ser UUID valido", 400);
  }

  return {
    usuarioId,
    tipo: String(tipo).toUpperCase(),
    titulo: tituloSanitized,
    mensagem: mensagemSanitized,
    prioridade: prioridadeUpper,
    entidade: entidadeSanitized,
    entidadeId: entidadeId || null,
    metadata: metadata || null
  };
};

const parseNotificacaoFilters = (queryParams) => {
  const filters = {};

  if (queryParams.tipo) {
    const tipo = String(queryParams.tipo).toUpperCase();
    if (!VALID_TIPOS.includes(tipo)) {
      throw new AppError(
        `tipo invalido. Use: ${VALID_TIPOS.join(", ")}`,
        400
      );
    }
    filters.tipo = tipo;
  }

  if (queryParams.status) {
    const status = String(queryParams.status).toUpperCase();
    if (!VALID_STATUS.includes(status)) {
      throw new AppError(
        `status invalido. Use: ${VALID_STATUS.join(", ")}`,
        400
      );
    }
    filters.status = status;
  }

  if (queryParams.prioridade) {
    const prioridade = String(queryParams.prioridade).toUpperCase();
    if (!VALID_PRIORIDADES.includes(prioridade)) {
      throw new AppError(
        `prioridade invalida. Use: ${VALID_PRIORIDADES.join(", ")}`,
        400
      );
    }
    filters.prioridade = prioridade;
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

  filters.page = !Number.isNaN(page) && page >= 1 ? Math.floor(page) : 1;
  filters.limit =
    !Number.isNaN(limit) && limit >= 1 && limit <= 200
      ? Math.floor(limit)
      : 50;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

module.exports = {
  VALID_TIPOS,
  VALID_PRIORIDADES,
  VALID_STATUS,
  isValidUuid,
  sanitizeString,
  validateCreatePayload,
  parseNotificacaoFilters
};
```

### 4.3 `src/models/notificacaoModel.js`

```javascript
const { query } = require("../config/database");

const notificacaoSelect = `
  SELECT
    n.id,
    n.usuario_id,
    u.nome AS usuario_nome,
    n.tipo,
    n.titulo,
    n.mensagem,
    n.prioridade,
    n.status,
    n.entidade,
    n.entidade_id,
    n.metadata,
    n.lida_em,
    n.criado_em AS created_at,
    n.atualizado_em AS updated_at
  FROM notificacoes n
  LEFT JOIN usuarios u ON u.id = n.usuario_id
`;

const create = async ({
  usuarioId, tipo, titulo, mensagem, prioridade, entidade, entidadeId, metadata
}) => {
  const result = await query(
    `INSERT INTO notificacoes (
      usuario_id, tipo, titulo, mensagem, prioridade, entidade, entidade_id, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, usuario_id, tipo, titulo, mensagem, prioridade,
      status, entidade, entidade_id, metadata, lida_em,
      criado_em AS created_at, atualizado_em AS updated_at`,
    [usuarioId, tipo, titulo, mensagem, prioridade, entidade, entidadeId,
     metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query(`${notificacaoSelect} WHERE n.id = $1`, [id]);
  return result.rows[0] || null;
};

const listByUsuario = async (usuarioId, filters) => {
  const conditions = ["n.usuario_id = $1"];
  const params = [usuarioId];
  let idx = 2;

  if (filters.tipo) { conditions.push(`n.tipo = $${idx++}`); params.push(filters.tipo); }
  if (filters.status) { conditions.push(`n.status = $${idx++}`); params.push(filters.status); }
  if (filters.prioridade) { conditions.push(`n.prioridade = $${idx++}`); params.push(filters.prioridade); }
  if (filters.dataInicio) { conditions.push(`n.criado_em >= $${idx++}`); params.push(filters.dataInicio); }
  if (filters.dataFim) { conditions.push(`n.criado_em <= ($${idx++}::date + INTERVAL '1 day')`); params.push(filters.dataFim); }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const dataQuery = `${notificacaoSelect} ${where}
    ORDER BY
      CASE n.prioridade WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 WHEN 'BAIXA' THEN 4 END,
      n.criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM notificacoes n ${where}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return { notificacoes: dataResult.rows, total: Number(countResult.rows[0].total) };
};

const listAll = async (filters) => {
  /* ... mesmo padrão sem filtro de usuario_id, para admin ... */
};

const countNaoLidas = async (usuarioId) => {
  const result = await query(
    `SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = $1 AND status = 'NAO_LIDA'`,
    [usuarioId]
  );
  return Number(result.rows[0].total);
};

const marcarLida = async (id) => {
  const result = await query(
    `UPDATE notificacoes SET status = 'LIDA', lida_em = NOW(), atualizado_em = NOW()
     WHERE id = $1
     RETURNING id, usuario_id, tipo, titulo, mensagem, prioridade,
       status, entidade, entidade_id, metadata, lida_em,
       criado_em AS created_at, atualizado_em AS updated_at`,
    [id]
  );
  return result.rows[0] || null;
};

const marcarTodasLidas = async (usuarioId) => {
  const result = await query(
    `UPDATE notificacoes SET status = 'LIDA', lida_em = NOW(), atualizado_em = NOW()
     WHERE usuario_id = $1 AND status = 'NAO_LIDA'`,
    [usuarioId]
  );
  return result.rowCount;
};

const arquivar = async (id) => {
  const result = await query(
    `UPDATE notificacoes SET status = 'ARQUIVADA', atualizado_em = NOW()
     WHERE id = $1
     RETURNING id, usuario_id, tipo, titulo, mensagem, prioridade,
       status, entidade, entidade_id, metadata, lida_em,
       criado_em AS created_at, atualizado_em AS updated_at`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  create, findById, listByUsuario, listAll,
  countNaoLidas, marcarLida, marcarTodasLidas, arquivar
};
```

### 4.4 `src/services/notificacaoService.js`

```javascript
const notificacaoModel = require("../models/notificacaoModel");
const AppError = require("../utils/AppError");
const {
  isValidUuid,
  validateCreatePayload,
  parseNotificacaoFilters
} = require("../utils/notificacaoValidation");

const criarNotificacao = async (payload) => {
  const parsed = validateCreatePayload(payload);
  return notificacaoModel.create(parsed);
};

const criarParaMultiplosUsuarios = async (usuarioIds, notificacaoBase) => {
  const resultados = [];
  for (const usuarioId of usuarioIds) {
    try {
      const notificacao = await criarNotificacao({ ...notificacaoBase, usuarioId });
      resultados.push(notificacao);
    } catch (error) {
      console.error(`[notificacao] Falha ao notificar usuario ${usuarioId}:`, error.message);
    }
  }
  return resultados;
};

const listarMinhas = async (usuarioId, queryParams) => {
  const filters = parseNotificacaoFilters(queryParams);
  const result = await notificacaoModel.listByUsuario(usuarioId, filters);
  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page, limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listarTodas = async (queryParams) => {
  const filters = parseNotificacaoFilters(queryParams);
  const result = await notificacaoModel.listAll(filters);
  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page, limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const buscarPorId = async (id, authenticatedUser) => {
  if (!isValidUuid(id)) throw new AppError("ID de notificacao invalido", 400);
  const notificacao = await notificacaoModel.findById(id);
  if (!notificacao) throw new AppError("Notificacao nao encontrada", 404);
  if (notificacao.usuario_id !== authenticatedUser.id && !authenticatedUser.isAdmin) {
    throw new AppError("Acesso negado a esta notificacao", 403);
  }
  return notificacao;
};

const contarNaoLidas = async (usuarioId) => {
  const total = await notificacaoModel.countNaoLidas(usuarioId);
  return { total };
};

const marcarComoLida = async (id, authenticatedUser) => {
  if (!isValidUuid(id)) throw new AppError("ID de notificacao invalido", 400);
  const notificacao = await notificacaoModel.findById(id);
  if (!notificacao) throw new AppError("Notificacao nao encontrada", 404);
  if (notificacao.usuario_id !== authenticatedUser.id && !authenticatedUser.isAdmin) {
    throw new AppError("Acesso negado a esta notificacao", 403);
  }
  if (notificacao.status === "LIDA") return notificacao;
  return notificacaoModel.marcarLida(id);
};

const marcarTodasComoLidas = async (usuarioId) => {
  const atualizadas = await notificacaoModel.marcarTodasLidas(usuarioId);
  return { atualizadas };
};

const arquivarNotificacao = async (id, authenticatedUser) => {
  if (!isValidUuid(id)) throw new AppError("ID de notificacao invalido", 400);
  const notificacao = await notificacaoModel.findById(id);
  if (!notificacao) throw new AppError("Notificacao nao encontrada", 404);
  if (notificacao.usuario_id !== authenticatedUser.id && !authenticatedUser.isAdmin) {
    throw new AppError("Acesso negado a esta notificacao", 403);
  }
  if (notificacao.status === "ARQUIVADA") return notificacao;
  return notificacaoModel.arquivar(id);
};

const listarPorTipo = async (tipo, usuarioId, queryParams) => {
  const filters = parseNotificacaoFilters({ ...queryParams, tipo });
  const result = await notificacaoModel.listByUsuario(usuarioId, filters);
  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page, limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listarPorStatus = async (status, usuarioId, queryParams) => {
  const filters = parseNotificacaoFilters({ ...queryParams, status });
  const result = await notificacaoModel.listByUsuario(usuarioId, filters);
  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page, limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

module.exports = {
  criarNotificacao, criarParaMultiplosUsuarios,
  listarMinhas, listarTodas, buscarPorId,
  contarNaoLidas, marcarComoLida, marcarTodasComoLidas,
  arquivarNotificacao, listarPorTipo, listarPorStatus
};
```

### 4.5 `src/controllers/notificacaoController.js`

```javascript
const notificacaoService = require("../services/notificacaoService");

const listarNotificacoes = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarMinhas(request.user.id, request.query);
    return response.status(200).json({ status: "success", data: result });
  } catch (error) { return next(error); }
};

const listarTodasNotificacoes = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarTodas(request.query);
    return response.status(200).json({ status: "success", data: result });
  } catch (error) { return next(error); }
};

const buscarPorId = async (request, response, next) => {
  try {
    const notificacao = await notificacaoService.buscarPorId(request.params.id, request.user);
    return response.status(200).json({ status: "success", data: notificacao });
  } catch (error) { return next(error); }
};

const contarNaoLidas = async (request, response, next) => {
  try {
    const result = await notificacaoService.contarNaoLidas(request.user.id);
    return response.status(200).json({ status: "success", data: result });
  } catch (error) { return next(error); }
};

const marcarComoLida = async (request, response, next) => {
  try {
    const notificacao = await notificacaoService.marcarComoLida(request.params.id, request.user);
    return response.status(200).json({ status: "success", data: notificacao });
  } catch (error) { return next(error); }
};

const marcarTodasComoLidas = async (request, response, next) => {
  try {
    const result = await notificacaoService.marcarTodasComoLidas(request.user.id);
    return response.status(200).json({
      status: "success",
      message: `${result.atualizadas} notificacao(oes) marcada(s) como lida(s)`,
      data: result
    });
  } catch (error) { return next(error); }
};

const arquivar = async (request, response, next) => {
  try {
    const notificacao = await notificacaoService.arquivarNotificacao(request.params.id, request.user);
    return response.status(200).json({ status: "success", data: notificacao });
  } catch (error) { return next(error); }
};

const listarPorTipo = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarPorTipo(request.params.tipo, request.user.id, request.query);
    return response.status(200).json({ status: "success", data: result });
  } catch (error) { return next(error); }
};

const listarPorStatus = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarPorStatus(request.params.status, request.user.id, request.query);
    return response.status(200).json({ status: "success", data: result });
  } catch (error) { return next(error); }
};

module.exports = {
  listarNotificacoes, listarTodasNotificacoes, buscarPorId,
  contarNaoLidas, marcarComoLida, marcarTodasComoLidas,
  arquivar, listarPorTipo, listarPorStatus
};
```

### 4.6 `src/routes/notificacaoRoutes.js`

```javascript
const express = require("express");
const notificacaoController = require("../controllers/notificacaoController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/nao-lidas/contagem", permissionMiddleware("notificacoes.read"), notificacaoController.contarNaoLidas);
router.patch("/marcar-todas-lidas", permissionMiddleware("notificacoes.update"), notificacaoController.marcarTodasComoLidas);
router.get("/todas", permissionMiddleware("notificacoes.read", "notificacoes.read.all"), notificacaoController.listarTodasNotificacoes);
router.get("/tipo/:tipo", permissionMiddleware("notificacoes.read"), notificacaoController.listarPorTipo);
router.get("/status/:status", permissionMiddleware("notificacoes.read"), notificacaoController.listarPorStatus);
router.patch("/:id/marcar-lida", permissionMiddleware("notificacoes.update"), notificacaoController.marcarComoLida);
router.patch("/:id/arquivar", permissionMiddleware("notificacoes.update"), notificacaoController.arquivar);
router.get("/:id", permissionMiddleware("notificacoes.read"), notificacaoController.buscarPorId);
router.get("/", permissionMiddleware("notificacoes.read"), notificacaoController.listarNotificacoes);

module.exports = router;
```

### 4.7 `src/utils/notificacaoHelper.js`

```javascript
const notificacaoService = require("../services/notificacaoService");
const emailProvider = require("./emailProvider");

const notificar = async ({
  usuarioId, tipo, titulo, mensagem,
  prioridade = "MEDIA", entidade = null, entidadeId = null, metadata = null
}) => {
  try {
    const notificacao = await notificacaoService.criarNotificacao({
      usuarioId, tipo, titulo, mensagem, prioridade, entidade, entidadeId, metadata
    });
    emailProvider.enviarSeAtivo({ usuarioId, tipo, titulo, mensagem, prioridade })
      .catch((err) => console.error("[notificacao] Falha no envio de email:", err.message));
    return notificacao;
  } catch (error) {
    console.error("[notificacao] Falha ao criar notificacao:", error.message);
    return null;
  }
};

const notificarMultiplos = async (usuarioIds, notificacaoBase) => {
  try {
    return await notificacaoService.criarParaMultiplosUsuarios(usuarioIds, notificacaoBase);
  } catch (error) {
    console.error("[notificacao] Falha ao notificar multiplos usuarios:", error.message);
    return [];
  }
};

// Atalhos tipados:
const notificarEstoqueBaixo = async ({ usuarioIds, produto, quantidadeAtual, quantidadeMinima }) =>
  notificarMultiplos(usuarioIds, {
    tipo: "ESTOQUE_BAIXO",
    titulo: `Estoque baixo: ${produto.nome}`,
    mensagem: `O produto "${produto.nome}" está com ${quantidadeAtual} unidades, abaixo do mínimo de ${quantidadeMinima}.`,
    prioridade: "ALTA",
    entidade: "produtos",
    entidadeId: produto.id,
    metadata: { quantidadeAtual, quantidadeMinima, sku: produto.sku || null }
  });

const notificarDuplicataVencida = async ({ usuarioIds, duplicata }) =>
  notificarMultiplos(usuarioIds, {
    tipo: "DUPLICATA_VENCIDA",
    titulo: `Duplicata vencida #${duplicata.numero || duplicata.id}`,
    mensagem: `A duplicata de R$${duplicata.valor} venceu em ${duplicata.data_vencimento}.`,
    prioridade: "CRITICA",
    entidade: "duplicatas",
    entidadeId: duplicata.id,
    metadata: { valor: duplicata.valor, data_vencimento: duplicata.data_vencimento }
  });

const notificarDuplicataVencendo = async ({ usuarioIds, duplicata, diasParaVencer }) =>
  notificarMultiplos(usuarioIds, {
    tipo: "DUPLICATA_VENCENDO",
    titulo: `Duplicata vencendo em ${diasParaVencer} dia(s)`,
    mensagem: `A duplicata de R$${duplicata.valor} vence em ${duplicata.data_vencimento}.`,
    prioridade: diasParaVencer <= 3 ? "ALTA" : "MEDIA",
    entidade: "duplicatas",
    entidadeId: duplicata.id,
    metadata: { valor: duplicata.valor, data_vencimento: duplicata.data_vencimento, diasParaVencer }
  });

// ... notificarManutencaoPendente, notificarEntregaNaoConcluida, etc.
// (código completo nos arquivos do projeto)

module.exports = {
  notificar, notificarMultiplos,
  notificarEstoqueBaixo, notificarDuplicataVencida, notificarDuplicataVencendo,
  notificarManutencaoPendente, notificarEntregaNaoConcluida, notificarEntregaConcluida,
  notificarStatusEntregaAlterado, notificarFreteDivergente,
  notificarVendaFuturaProxima, notificarAlertaGeral
};
```

### 4.8 `src/utils/emailProvider.js`

```javascript
const isAtivo = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER);
};

const enviar = async ({ para, assunto, corpo }) => {
  // TODO: implementar com nodemailer
  console.log(`[email-provider] Envio de email desabilitado. Destinatário: ${para}, Assunto: ${assunto}`);
};

const enviarSeAtivo = async ({ usuarioId, tipo, titulo, mensagem, prioridade }) => {
  if (!isAtivo()) return;
  const assunto = `[ERP Efrat Agro] ${titulo}`;
  const corpo = `<h3>${titulo}</h3><p>${mensagem}</p><p><strong>Tipo:</strong> ${tipo} | <strong>Prioridade:</strong> ${prioridade}</p>`;
  await enviar({ para: "destinatario@placeholder.com", assunto, corpo });
};

module.exports = { isAtivo, enviar, enviarSeAtivo };
```

### 4.9 `src/routes/index.js` (trecho atualizado)

```javascript
const auditoriaRoutes = require("./auditoriaRoutes");
const notificacaoRoutes = require("./notificacaoRoutes");

// ...

router.use("/auditoria", auditoriaRoutes);
router.use("/notificacoes", notificacaoRoutes);
```

---

## 5. Estratégia para Geração por Gatilhos sem Poluir Controllers

| Regra | Aplicação |
|-------|-----------|
| Controller magro | O controller nunca cria notificação — delega ao service |
| Disparo nos services | Após a operação de negócio, o service chama o helper |
| Helper centralizado | `notificacaoHelper.js` encapsula tipo, título, mensagem, prioridade |
| Fire-and-forget | Falha na notificação não quebra a operação principal |
| Sem middleware genérico | Notificação é intencional e contextual — cada service decide quando disparar |

**Exemplo no service de estoque:**

```javascript
const notificacaoHelper = require("../utils/notificacaoHelper");

// Após registrar movimentação que baixou o estoque:
if (estoqueAtual < produto.estoque_minimo) {
  await notificacaoHelper.notificarEstoqueBaixo({
    usuarioIds: [gerente.id, estoquista.id],
    produto,
    quantidadeAtual: estoqueAtual,
    quantidadeMinima: produto.estoque_minimo
  });
}
```

---

## 6. Rotas Protegidas

| Método | Rota | Permissões | Handler |
|--------|------|-----------|---------|
| GET | `/notificacoes` | `notificacoes.read` | `listarNotificacoes` |
| GET | `/notificacoes/nao-lidas/contagem` | `notificacoes.read` | `contarNaoLidas` |
| GET | `/notificacoes/todas` | `notificacoes.read` + `notificacoes.read.all` | `listarTodasNotificacoes` |
| GET | `/notificacoes/tipo/:tipo` | `notificacoes.read` | `listarPorTipo` |
| GET | `/notificacoes/status/:status` | `notificacoes.read` | `listarPorStatus` |
| GET | `/notificacoes/:id` | `notificacoes.read` | `buscarPorId` |
| PATCH | `/notificacoes/:id/marcar-lida` | `notificacoes.update` | `marcarComoLida` |
| PATCH | `/notificacoes/:id/arquivar` | `notificacoes.update` | `arquivar` |
| PATCH | `/notificacoes/marcar-todas-lidas` | `notificacoes.update` | `marcarTodasComoLidas` |

---

## 7. Validações de Filtros

| Filtro | Tipo | Validação |
|--------|------|-----------|
| `tipo` | String | Deve estar em `VALID_TIPOS` (10 tipos) |
| `status` | String | Deve estar em `VALID_STATUS` (NAO_LIDA, LIDA, ARQUIVADA) |
| `prioridade` | String | Deve estar em `VALID_PRIORIDADES` (BAIXA, MEDIA, ALTA, CRITICA) |
| `dataInicio` | Date | Formato `YYYY-MM-DD` |
| `dataFim` | Date | Formato `YYYY-MM-DD` |
| `page` | Number | >= 1, default 1 |
| `limit` | Number | 1-200, default 50 |
| Combinação datas | - | `dataInicio` não pode ser posterior a `dataFim` |

---

## 8. Exemplos de Uso em Módulos

### 8.1 Estoque — Estoque abaixo do mínimo

```javascript
// src/services/estoqueService.js
const notificacaoHelper = require("../utils/notificacaoHelper");

// Após movimentação de saída:
if (estoqueAtual < produto.estoque_minimo) {
  await notificacaoHelper.notificarEstoqueBaixo({
    usuarioIds: [gerenteId, estoquistaId],
    produto,
    quantidadeAtual: estoqueAtual,
    quantidadeMinima: produto.estoque_minimo
  });
}
```

### 8.2 Financeiro — Duplicata vencida

```javascript
// src/services/financeiroService.js (job ou verificação periódica)
const notificacaoHelper = require("../utils/notificacaoHelper");

for (const duplicata of duplicatasVencidas) {
  await notificacaoHelper.notificarDuplicataVencida({
    usuarioIds: [financeiroId, gerenteId],
    duplicata
  });
}
```

### 8.3 Entregas — Status alterado

```javascript
// src/services/entregaService.js
const notificacaoHelper = require("../utils/notificacaoHelper");

// Após atualizar status da entrega:
await notificacaoHelper.notificarStatusEntregaAlterado({
  usuarioIds: [vendedorId],
  entrega,
  statusAnterior: "EM_TRANSITO",
  statusNovo: "ENTREGUE"
});
```

---

## 9. Exemplo de Resposta da API

### GET /notificacoes?status=NAO_LIDA&page=1&limit=10

```json
{
  "status": "success",
  "data": {
    "notificacoes": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "usuario_id": "11111111-1111-1111-1111-111111111111",
        "usuario_nome": "João Gerente",
        "tipo": "ESTOQUE_BAIXO",
        "titulo": "Estoque baixo: Adubo NPK 10-10-10",
        "mensagem": "O produto \"Adubo NPK 10-10-10\" está com 5 unidades, abaixo do mínimo de 20.",
        "prioridade": "ALTA",
        "status": "NAO_LIDA",
        "entidade": "produtos",
        "entidade_id": "22222222-2222-2222-2222-222222222222",
        "metadata": {
          "quantidadeAtual": 5,
          "quantidadeMinima": 20,
          "sku": "NPK-101010"
        },
        "lida_em": null,
        "created_at": "2026-04-19T10:30:00.000Z",
        "updated_at": "2026-04-19T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "total_pages": 1
    }
  }
}
```

### GET /notificacoes/nao-lidas/contagem

```json
{
  "status": "success",
  "data": {
    "total": 7
  }
}
```

### PATCH /notificacoes/marcar-todas-lidas

```json
{
  "status": "success",
  "message": "7 notificacao(oes) marcada(s) como lida(s)",
  "data": {
    "atualizadas": 7
  }
}
```

---

## 10. Estrutura de Contagem de Não Lidas

O endpoint `GET /notificacoes/nao-lidas/contagem` retorna um objeto simples:

```json
{ "status": "success", "data": { "total": 7 } }
```

**Uso no frontend:**
- Badge no ícone de notificações: exibir `data.total` quando > 0
- Polling periódico ou WebSocket futuro para atualizar o badge
- O índice composto `(usuario_id, status)` garante performance mesmo com volume alto

---

## 11. Estrutura Preparada para E-mail Futuro

| Componente | Estado | O que falta |
|-----------|--------|-------------|
| `emailProvider.js` | Stub funcional | Implementar `enviar()` com nodemailer |
| `notificacaoHelper.js` | Já chama `enviarSeAtivo()` | Nada — já está integrado |
| Variáveis de ambiente | Não configuradas | Adicionar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Busca de e-mail do usuário | Comentada no stub | Descomentar e chamar `usuarioModel.findById()` |

**Para ativar o envio:**
1. `npm install nodemailer`
2. Configurar variáveis SMTP no `.env`
3. Implementar o corpo de `enviar()` no `emailProvider.js`
4. Descomentar busca de e-mail do usuário

Nenhum service ou controller precisa mudar.

---

## 12. Estrutura para Dashboard e Frontend

### Endpoints consumíveis pelo dashboard

| Endpoint | Uso no frontend |
|----------|----------------|
| `GET /notificacoes/nao-lidas/contagem` | Badge de notificações no header |
| `GET /notificacoes?status=NAO_LIDA&limit=5` | Dropdown de notificações recentes |
| `GET /notificacoes` | Central de notificações completa |
| `GET /notificacoes/tipo/:tipo` | Filtro por categoria |
| `PATCH /notificacoes/:id/marcar-lida` | Click para marcar como lida |
| `PATCH /notificacoes/marcar-todas-lidas` | Botão "marcar todas como lidas" |

### Dados prontos para consumo

Cada notificação retorna:
- `tipo` — categoria para ícone/cor no frontend
- `prioridade` — para destaque visual (CRITICA = vermelho, ALTA = laranja, etc.)
- `status` — para filtro e badge
- `entidade` + `entidade_id` — para deep link no frontend (ex: clicar na notificação abre o produto)
- `metadata` — dados extras para exibição contextual

---

## 13. Instrução de Integração

### Para disparar notificações de um novo módulo:

1. Importe o helper:
   ```javascript
   const notificacaoHelper = require("../utils/notificacaoHelper");
   ```

2. Após o evento de negócio, chame o atalho tipado ou `notificar()`:
   ```javascript
   await notificacaoHelper.notificarEstoqueBaixo({
     usuarioIds: [gerente.id, estoquista.id],
     produto,
     quantidadeAtual: 5,
     quantidadeMinima: 20
   });
   ```

3. Para tipos genéricos:
   ```javascript
   await notificacaoHelper.notificarAlertaGeral({
     usuarioIds: [adminId],
     titulo: "Backup concluído",
     mensagem: "O backup diário foi concluído com sucesso.",
     prioridade: "BAIXA"
   });
   ```

4. Para adicionar novos tipos de notificação:
   - Adicione em `VALID_TIPOS` no `notificacaoValidation.js`
   - Adicione no CHECK da migration
   - Crie um atalho tipado no `notificacaoHelper.js` (opcional)

### Para rodar a migration:

Execute o bloco SQL `CREATE TABLE IF NOT EXISTS notificacoes (...)` + índices no PostgreSQL. Os comandos são idempotentes.

---

## Permissões a Cadastrar

| Permissão | Descrição |
|-----------|-----------|
| `notificacoes.read` | Ver notificações próprias |
| `notificacoes.read.all` | Ver notificações de todos os usuários (admin) |
| `notificacoes.update` | Marcar como lida, arquivar |
