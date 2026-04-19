# CRUD de Clientes

## 1. Explicacao Curta da Implementacao

O modulo de clientes foi implementado em arquitetura `MSC`, seguindo o mesmo padrao do backend existente: controller fino, service com regra de negocio, model com SQL explicito e validacoes centralizadas em utilitarios.

### Decisoes tecnicas principais

- o status do cliente foi separado do update geral e tratado em endpoint proprio;
- `BLOQUEADO` e `INATIVO` nao sao tratados como a mesma coisa;
- a listagem padrao exclui clientes `INATIVO`, salvo filtro explicito ou `include_inativos=true`;
- o endpoint de historico de compras usa `vendas` e `itens_venda`, pois o schema atual ja suporta essa leitura;
- o endpoint de debitos em aberto usa `duplicatas` e retorna resumo financeiro real;
- o endpoint `PATCH /clientes/:id/status` resolve permissao de forma dinamica, diferenciando update, bloqueio e inativacao.

---

## 2. Estrutura dos Arquivos

```txt
/backend/src
  /controllers
    clienteController.js
  /services
    clienteService.js
  /models
    clienteModel.js
  /routes
    clienteRoutes.js
    index.js
  /utils
    clienteValidation.js
    permissions.js
  /middlewares
    authMiddleware.js
    permissionMiddleware.js
```

---

## 3. Rotas Entregues e Protegidas

- `POST /api/clientes` com `clientes.create`
- `GET /api/clientes` com `clientes.read`
- `GET /api/clientes/:id` com `clientes.read`
- `PUT /api/clientes/:id` com `clientes.update`
- `PATCH /api/clientes/:id/status` com verificacao dinamica de `clientes.update`, `clientes.block` ou `clientes.inactivate`
- `PATCH /api/clientes/:id/inativar` com `clientes.inactivate`
- `GET /api/clientes/:id/historico-compras` com `clientes.read`
- `GET /api/clientes/:id/debitos-em-aberto` com `clientes.read` na rota e `clientes.financial.read` na regra de negocio

---

## 4. Validacoes Implementadas

- nome/razao social obrigatorio
- CPF/CNPJ obrigatorio
- validacao real de CPF e CNPJ
- duplicidade de CPF/CNPJ em criacao e atualizacao
- tipo de cliente aceitando apenas `PF` e `PJ`
- status aceitando apenas `ATIVO`, `BLOQUEADO` e `INATIVO`
- validacao de e-mail quando informado
- validacao de `limite_credito` como numero valido e nao negativo
- validacao de UUID na rota
- tratamento de cliente inexistente com `404`
- bloqueio de transicao inconsistente de `INATIVO` para `BLOQUEADO`
- bloqueio de alteracao de status repetida com `409`
- bloqueio de alteracao de status via `PUT`, exigindo o endpoint proprio

---

## 5. Exemplo de Payload de Criacao

```json
{
  "nome_razao_social": "Cooperativa Agro Centro-Oeste",
  "cpf_cnpj": "98.765.432/0001-10",
  "email": "financeiro@coopagro.com.br",
  "telefone": "(64) 3333-2222",
  "tipo_cliente": "PJ",
  "limite_credito": 85000,
  "endereco": {
    "cep": "75800-000",
    "logradouro": "Avenida Central",
    "numero": "220",
    "complemento": "Sala 4",
    "bairro": "Centro",
    "cidade": "Jatai",
    "estado": "GO"
  },
  "observacoes": "Cliente com operacao a prazo e acompanhamento financeiro frequente.",
  "status": "ATIVO"
}
```

## 6. Exemplo de Payload de Atualizacao de Status

```json
{
  "status": "BLOQUEADO"
}
```

## 7. Exemplo de Resposta da API

```json
{
  "status": "success",
  "message": "Cliente cadastrado com sucesso",
  "data": {
    "id": "0e98a4a8-2418-4c79-a35d-9d0f2cc6a10a",
    "nome_razao_social": "Cooperativa Agro Centro-Oeste",
    "cpf_cnpj": "98765432000110",
    "email": "financeiro@coopagro.com.br",
    "telefone": "(64) 3333-2222",
    "tipo_cliente": "PJ",
    "limite_credito": "85000.00",
    "endereco": {
      "cep": "75800-000",
      "logradouro": "Avenida Central",
      "numero": "220",
      "complemento": "Sala 4",
      "bairro": "Centro",
      "cidade": "Jatai",
      "estado": "GO"
    },
    "observacoes": "Cliente com operacao a prazo e acompanhamento financeiro frequente.",
    "status": "ATIVO",
    "created_at": "2026-04-19T19:00:00.000Z",
    "updated_at": "2026-04-19T19:00:00.000Z"
  }
}
```

## 8. Estrutura para Historico de Compras

O endpoint `GET /clientes/:id/historico-compras` retorna:

- dados basicos do cliente;
- resumo com total de vendas, valor total comprado e data da ultima compra;
- lista das ultimas vendas com itens agregados.

## 9. Estrutura para Debitos em Aberto

O endpoint `GET /clientes/:id/debitos-em-aberto` retorna:

- dados basicos do cliente;
- limite de credito atual;
- resumo com quantidade de duplicatas, valor em aberto e proximo vencimento;
- lista de titulos em aberto, parcialmente pagos ou vencidos.

---

## 10. Codigo Completo dos Arquivos

### `backend/src/controllers/clienteController.js`

```javascript
const clienteService = require("../services/clienteService");

const createCliente = async (request, response, next) => {
  try {
    const cliente = await clienteService.createCliente({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Cliente cadastrado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const listClientes = async (request, response, next) => {
  try {
    const result = await clienteService.listClientes(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getClienteById = async (request, response, next) => {
  try {
    const cliente = await clienteService.getClienteById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const updateCliente = async (request, response, next) => {
  try {
    const cliente = await clienteService.updateCliente({
      clienteId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Cliente atualizado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const changeClienteStatus = async (request, response, next) => {
  try {
    const cliente = await clienteService.changeClienteStatus({
      clienteId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Status do cliente atualizado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const inactivateCliente = async (request, response, next) => {
  try {
    const cliente = await clienteService.inactivateCliente({
      clienteId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Cliente inativado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const getHistoricoCompras = async (request, response, next) => {
  try {
    const historico = await clienteService.getHistoricoCompras(request.params.id);

    return response.status(200).json({
      status: "success",
      data: historico
    });
  } catch (error) {
    return next(error);
  }
};

const getDebitosEmAberto = async (request, response, next) => {
  try {
    const debitos = await clienteService.getDebitosEmAberto({
      clienteId: request.params.id,
      authenticatedUser: request.user
    });

    return response.status(200).json({
      status: "success",
      data: debitos
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCliente,
  listClientes,
  getClienteById,
  updateCliente,
  changeClienteStatus,
  inactivateCliente,
  getHistoricoCompras,
  getDebitosEmAberto
};

```

### `backend/src/services/clienteService.js`

```javascript
const clienteModel = require("../models/clienteModel");
const auditLogModel = require("../models/auditLogModel");
const authService = require("./authService");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseClientePayload,
  parseStatusPayload,
  parseListFilters,
  mapClienteResponse
} = require("../utils/clienteValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertClienteExists = async (clienteId) => {
  validateUuid(clienteId, "Cliente");

  const cliente = await clienteModel.findClienteById(clienteId);

  if (!cliente) {
    throw new AppError("Cliente nao encontrado", 404);
  }

  return cliente;
};

const ensureUniqueDocument = async (cpfCnpj, excludeId = null) => {
  const cliente = await clienteModel.findClienteByDocument(cpfCnpj, excludeId);

  if (cliente) {
    throw new AppError("Ja existe cliente cadastrado com este CPF/CNPJ", 409);
  }
};

const resolveStatusPermission = (status) => {
  if (status === "INATIVO") {
    return "clientes.inactivate";
  }

  if (status === "BLOQUEADO") {
    return "clientes.block";
  }

  return "clientes.update";
};

const createCliente = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseClientePayload(payload, { allowStatus: true });

  await ensureUniqueDocument(parsedPayload.cpfCnpj);

  const cliente = await clienteModel.createCliente(parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "clientes",
    recordId: cliente.id,
    action: "INSERT",
    newData: {
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      status: cliente.status
    },
    ...metadata
  });

  return mapClienteResponse(cliente);
};

const listClientes = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [clientes, total] = await Promise.all([
    clienteModel.listClientes(filters),
    clienteModel.countClientes(filters)
  ]);

  return {
    items: clientes.map(mapClienteResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getClienteById = async (clienteId) => {
  const cliente = await assertClienteExists(clienteId);
  return mapClienteResponse(cliente);
};

const updateCliente = async ({
  clienteId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentCliente = await assertClienteExists(clienteId);
  const parsedPayload = parseClientePayload(payload);

  await ensureUniqueDocument(parsedPayload.cpfCnpj, clienteId);

  const cliente = await clienteModel.updateCliente(clienteId, parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "clientes",
    recordId: cliente.id,
    action: "UPDATE",
    previousData: {
      nome_razao_social: currentCliente.nome_razao_social,
      cpf_cnpj: currentCliente.cpf_cnpj,
      limite_credito: currentCliente.limite_credito
    },
    newData: {
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      limite_credito: cliente.limite_credito
    },
    ...metadata
  });

  return mapClienteResponse(cliente);
};

const changeClienteStatus = async ({
  clienteId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentCliente = await assertClienteExists(clienteId);
  const nextStatus = parseStatusPayload(payload);

  authService.ensurePermission(
    authenticatedUser,
    resolveStatusPermission(nextStatus)
  );

  if (currentCliente.status === nextStatus) {
    throw new AppError("Cliente ja possui o status informado", 409);
  }

  if (currentCliente.status === "INATIVO" && nextStatus === "BLOQUEADO") {
    throw new AppError(
      "Cliente inativo nao pode ser alterado diretamente para bloqueado",
      409
    );
  }

  const cliente = await clienteModel.updateClienteStatus(clienteId, nextStatus);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "clientes",
    recordId: cliente.id,
    action: "UPDATE",
    previousData: { status: currentCliente.status },
    newData: { status: cliente.status },
    ...metadata
  });

  return mapClienteResponse(cliente);
};

const inactivateCliente = async ({
  clienteId,
  authenticatedUser,
  request
}) => {
  return changeClienteStatus({
    clienteId,
    payload: { status: "INATIVO" },
    authenticatedUser,
    request
  });
};

const getHistoricoCompras = async (clienteId) => {
  const cliente = await assertClienteExists(clienteId);
  const historico = await clienteModel.getClienteHistoricoCompras(clienteId);

  return {
    cliente: {
      id: cliente.id,
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      status: cliente.status
    },
    summary: {
      total_vendas: historico.summary.total_vendas,
      valor_total_compras: historico.summary.valor_total_compras,
      ultima_compra_em: historico.summary.ultima_compra_em
    },
    historico_compras: historico.sales
  };
};

const getDebitosEmAberto = async ({
  clienteId,
  authenticatedUser
}) => {
  authService.ensurePermission(authenticatedUser, "clientes.financial.read");

  const cliente = await assertClienteExists(clienteId);
  const debitos = await clienteModel.getClienteDebitosEmAberto(clienteId);

  return {
    cliente: {
      id: cliente.id,
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      status: cliente.status,
      limite_credito: cliente.limite_credito
    },
    summary: {
      total_duplicatas_em_aberto: debitos.summary.total_duplicatas_em_aberto,
      valor_total_em_aberto: debitos.summary.valor_total_em_aberto,
      proximo_vencimento: debitos.summary.proximo_vencimento
    },
    debitos_em_aberto: debitos.titles
  };
};

module.exports = {
  createCliente,
  listClientes,
  getClienteById,
  updateCliente,
  changeClienteStatus,
  inactivateCliente,
  getHistoricoCompras,
  getDebitosEmAberto
};

```

### `backend/src/models/clienteModel.js`

```javascript
const { query } = require("../config/database");

const customerSelect = `
  SELECT
    id,
    tipo_pessoa,
    nome_razao_social,
    cpf_cnpj,
    email,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    limite_credito,
    observacoes,
    status,
    criado_em AS created_at,
    atualizado_em AS updated_at
  FROM clientes
`;

const createCliente = async (payload) => {
  const result = await query(
    `
      INSERT INTO clientes (
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING
        id,
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.tipoCliente,
      payload.nomeRazaoSocial,
      payload.cpfCnpj,
      payload.email,
      payload.telefone,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.limiteCredito,
      payload.observacoes,
      payload.status
    ]
  );

  return result.rows[0];
};

const findClienteById = async (clienteId) => {
  const result = await query(
    `
      ${customerSelect}
      WHERE id = $1
      LIMIT 1
    `,
    [clienteId]
  );

  return result.rows[0] || null;
};

const findClienteByDocument = async (cpfCnpj, excludeId = null) => {
  const result = await query(
    `
      SELECT id, cpf_cnpj
      FROM clientes
      WHERE cpf_cnpj = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [cpfCnpj, excludeId]
  );

  return result.rows[0] || null;
};

const listClientes = async ({
  status,
  search,
  limit,
  offset,
  includeInactive
}) => {
  const result = await query(
    `
      ${customerSelect}
      WHERE (
        (
          $1::varchar IS NOT NULL AND status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $5::boolean = TRUE
            OR status <> 'INATIVO'
          )
        )
      )
      AND (
        $2::varchar IS NULL
        OR nome_razao_social ILIKE '%' || $2 || '%'
        OR cpf_cnpj ILIKE '%' || $2 || '%'
        OR COALESCE(email, '') ILIKE '%' || $2 || '%'
      )
      ORDER BY nome_razao_social ASC
      LIMIT $3 OFFSET $4
    `,
    [status, search, limit, offset, includeInactive]
  );

  return result.rows;
};

const countClientes = async ({ status, search, includeInactive }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM clientes
      WHERE (
        (
          $1::varchar IS NOT NULL AND status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $3::boolean = TRUE
            OR status <> 'INATIVO'
          )
        )
      )
      AND (
        $2::varchar IS NULL
        OR nome_razao_social ILIKE '%' || $2 || '%'
        OR cpf_cnpj ILIKE '%' || $2 || '%'
        OR COALESCE(email, '') ILIKE '%' || $2 || '%'
      )
    `,
    [status, search, includeInactive]
  );

  return result.rows[0].total;
};

const updateCliente = async (clienteId, payload) => {
  const result = await query(
    `
      UPDATE clientes
      SET
        tipo_pessoa = $2,
        nome_razao_social = $3,
        cpf_cnpj = $4,
        email = $5,
        telefone = $6,
        cep = $7,
        logradouro = $8,
        numero = $9,
        complemento = $10,
        bairro = $11,
        cidade = $12,
        estado = $13,
        limite_credito = $14,
        observacoes = $15,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      clienteId,
      payload.tipoCliente,
      payload.nomeRazaoSocial,
      payload.cpfCnpj,
      payload.email,
      payload.telefone,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.limiteCredito,
      payload.observacoes
    ]
  );

  return result.rows[0] || null;
};

const updateClienteStatus = async (clienteId, status) => {
  const result = await query(
    `
      UPDATE clientes
      SET status = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [clienteId, status]
  );

  return result.rows[0] || null;
};

const getClienteHistoricoCompras = async (clienteId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_vendas,
        COALESCE(SUM(total_valor), 0)::numeric(14,2) AS valor_total_compras,
        MAX(data_venda) AS ultima_compra_em
      FROM vendas
      WHERE cliente_id = $1
        AND status IN ('CONFIRMADA', 'FATURADA')
    `,
    [clienteId]
  );

  const salesResult = await query(
    `
      SELECT
        v.id,
        v.numero,
        v.tipo_venda,
        v.status,
        v.forma_pagamento,
        v.data_venda,
        v.total_valor,
        COALESCE(
          json_agg(
            json_build_object(
              'produto_id', iv.produto_id,
              'quantidade', iv.quantidade,
              'preco_unitario', iv.preco_unitario,
              'total_valor', iv.total_valor
            )
            ORDER BY iv.sequencia
          ) FILTER (WHERE iv.id IS NOT NULL),
          '[]'::json
        ) AS itens
      FROM vendas v
      LEFT JOIN itens_venda iv ON iv.venda_id = v.id
      WHERE v.cliente_id = $1
      GROUP BY v.id
      ORDER BY v.data_venda DESC
      LIMIT 20
    `,
    [clienteId]
  );

  return {
    summary: summaryResult.rows[0],
    sales: salesResult.rows
  };
};

const getClienteDebitosEmAberto = async (clienteId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_duplicatas_em_aberto,
        COALESCE(SUM(valor_aberto), 0)::numeric(14,2) AS valor_total_em_aberto,
        MIN(vencimento) AS proximo_vencimento
      FROM duplicatas
      WHERE cliente_id = $1
        AND status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO')
        AND valor_aberto > 0
    `,
    [clienteId]
  );

  const titlesResult = await query(
    `
      SELECT
        id,
        venda_id,
        numero,
        parcela,
        valor_total,
        valor_aberto,
        vencimento,
        data_emissao,
        status
      FROM duplicatas
      WHERE cliente_id = $1
        AND status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO')
        AND valor_aberto > 0
      ORDER BY vencimento ASC, numero ASC
      LIMIT 50
    `,
    [clienteId]
  );

  return {
    summary: summaryResult.rows[0],
    titles: titlesResult.rows
  };
};

module.exports = {
  createCliente,
  findClienteById,
  findClienteByDocument,
  listClientes,
  countClientes,
  updateCliente,
  updateClienteStatus,
  getClienteHistoricoCompras,
  getClienteDebitosEmAberto
};

```

### `backend/src/routes/clienteRoutes.js`

```javascript
const express = require("express");

const clienteController = require("../controllers/clienteController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  permissionMiddleware("clientes.create"),
  clienteController.createCliente
);

router.get(
  "/",
  permissionMiddleware("clientes.read"),
  clienteController.listClientes
);

router.get(
  "/:id",
  permissionMiddleware("clientes.read"),
  clienteController.getClienteById
);

router.put(
  "/:id",
  permissionMiddleware("clientes.update"),
  clienteController.updateCliente
);

router.patch(
  "/:id/status",
  clienteController.changeClienteStatus
);

router.patch(
  "/:id/inativar",
  permissionMiddleware("clientes.inactivate"),
  clienteController.inactivateCliente
);

router.get(
  "/:id/historico-compras",
  permissionMiddleware("clientes.read"),
  clienteController.getHistoricoCompras
);

router.get(
  "/:id/debitos-em-aberto",
  permissionMiddleware("clientes.read"),
  clienteController.getDebitosEmAberto
);

module.exports = router;

```

### `backend/src/utils/clienteValidation.js`

```javascript
const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ATIVO", "BLOQUEADO", "INATIVO"];
const VALID_TIPO_CLIENTE = ["PF", "PJ"];

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

const sanitizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} invalido`, 400);
  }

  return parsed;
};

const validateUuid = (value, fieldName = "id") => {
  if (!UUID_PATTERN.test(String(value || ""))) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
};

const validateEmail = (email) => {
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new AppError("E-mail invalido", 400);
  }
};

const validateCpf = (cpf) => {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(digits[10]);
};

const validateCnpj = (cnpj) => {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calculateDigit = (base, factors) => {
    const sum = base.split("").reduce((accumulator, digit, index) => {
      return accumulator + Number(digit) * factors[index];
    }, 0);

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondFactor = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstDigit = calculateDigit(digits.slice(0, 12), firstFactor);
  const secondDigit = calculateDigit(
    digits.slice(0, 12) + String(firstDigit),
    secondFactor
  );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
};

const validateDocument = (document) => {
  const digits = onlyDigits(document);

  if (!digits) {
    throw new AppError("CPF/CNPJ obrigatorio", 400);
  }

  const isValid =
    (digits.length === 11 && validateCpf(digits)) ||
    (digits.length === 14 && validateCnpj(digits));

  if (!isValid) {
    throw new AppError("CPF/CNPJ invalido", 400);
  }

  return digits;
};

const normalizeEndereco = (endereco = {}) => ({
  cep: sanitizeString(endereco.cep),
  logradouro: sanitizeString(endereco.logradouro),
  numero: sanitizeString(endereco.numero),
  complemento: sanitizeString(endereco.complemento),
  bairro: sanitizeString(endereco.bairro),
  cidade: sanitizeString(endereco.cidade),
  estado: sanitizeString(endereco.estado)
});

const parseClientePayload = (payload, { allowStatus = false } = {}) => {
  const nomeRazaoSocial = sanitizeString(payload.nome_razao_social);
  const cpfCnpj = payload.cpf_cnpj !== undefined ? validateDocument(payload.cpf_cnpj) : null;
  const email = sanitizeString(payload.email);
  const tipoCliente = sanitizeString(payload.tipo_cliente) || null;
  const status = sanitizeString(payload.status) || null;
  const endereco = normalizeEndereco(payload.endereco || {});

  if (!nomeRazaoSocial) {
    throw new AppError("Nome/razao social obrigatorio", 400);
  }

  if (!cpfCnpj) {
    throw new AppError("CPF/CNPJ obrigatorio", 400);
  }

  validateEmail(email);

  const resolvedTipoCliente =
    tipoCliente || (cpfCnpj.length === 11 ? "PF" : "PJ");

  if (!VALID_TIPO_CLIENTE.includes(resolvedTipoCliente)) {
    throw new AppError("Tipo de cliente invalido", 400);
  }

  if (status && !allowStatus) {
    throw new AppError("Use o endpoint de status para alterar a situacao do cliente", 400);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para cliente", 400);
  }

  return {
    nomeRazaoSocial,
    cpfCnpj,
    email,
    telefone: sanitizeString(payload.telefone),
    tipoCliente: resolvedTipoCliente,
    limiteCredito: sanitizeNumber(payload.limite_credito, "Limite de credito"),
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado,
    observacoes: sanitizeString(payload.observacoes),
    status: status || "ATIVO"
  };
};

const parseStatusPayload = (payload) => {
  const status = sanitizeString(payload.status);

  if (!status || !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para cliente", 400);
  }

  return status;
};

const parseListFilters = (query) => {
  const status = sanitizeString(query.status);
  const search = sanitizeString(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const includeInactive =
    String(query.include_inativos || "false").toLowerCase() === "true";

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Filtro de status invalido", 400);
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Parametro limit invalido", 400);
  }

  return {
    status,
    search,
    page,
    limit,
    offset: (page - 1) * limit,
    includeInactive
  };
};

const mapClienteResponse = (cliente) => ({
  id: cliente.id,
  nome_razao_social: cliente.nome_razao_social,
  cpf_cnpj: cliente.cpf_cnpj,
  email: cliente.email,
  telefone: cliente.telefone,
  tipo_cliente: cliente.tipo_pessoa,
  limite_credito: cliente.limite_credito,
  endereco: {
    cep: cliente.cep,
    logradouro: cliente.logradouro,
    numero: cliente.numero,
    complemento: cliente.complemento,
    bairro: cliente.bairro,
    cidade: cliente.cidade,
    estado: cliente.estado
  },
  observacoes: cliente.observacoes,
  status: cliente.status,
  created_at: cliente.created_at,
  updated_at: cliente.updated_at
});

module.exports = {
  VALID_STATUS,
  validateUuid,
  parseClientePayload,
  parseStatusPayload,
  parseListFilters,
  mapClienteResponse
};

```

### `backend/src/middlewares/authMiddleware.js`

```javascript
const AppError = require("../utils/AppError");
const authService = require("../services/authService");

const authMiddleware = async (request, response, next) => {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError("Token de acesso nao informado", 401);
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Formato do token invalido", 401);
    }

    request.user = await authService.validateAuthenticatedRequest(token);

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authMiddleware;

```

### `backend/src/middlewares/permissionMiddleware.js`

```javascript
const authService = require("../services/authService");
const AppError = require("../utils/AppError");

const permissionMiddleware = (...requiredPermissions) => {
  return (request, response, next) => {
    try {
      if (!request.user) {
        throw new AppError("Usuario autenticado nao encontrado no contexto", 500);
      }

      requiredPermissions.forEach((permission) => {
        authService.ensurePermission(request.user, permission);
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = permissionMiddleware;

```

### `backend/src/utils/permissions.js`

```javascript
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

```

### `backend/src/routes/index.js`

```javascript
const express = require("express");

const healthController = require("../controllers/healthController");
const authRoutes = require("./authRoutes");
const clienteRoutes = require("./clienteRoutes");
const fornecedorRoutes = require("./fornecedorRoutes");

const router = express.Router();

router.get("/", (request, response) => {
  response.status(200).json({
    status: "success",
    message: "API base do ERP operacional"
  });
});

router.get("/health", healthController.getHealthStatus);
router.use("/auth", authRoutes);
router.use("/clientes", clienteRoutes);
router.use("/fornecedores", fornecedorRoutes);

module.exports = router;

```

### `backend/src/database/seeders.sql`

```sql
BEGIN;

INSERT INTO perfis_acesso (id, nome, descricao, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Acesso total ao sistema', 'ATIVO'),
  ('22222222-2222-2222-2222-222222222222', 'Vendedor', 'Operacao comercial e consulta de clientes e produtos', 'ATIVO'),
  ('33333333-3333-3333-3333-333333333333', 'Financeiro', 'Gestao de duplicatas, pagamentos e relatorios financeiros', 'ATIVO'),
  ('44444444-4444-4444-4444-444444444444', 'Estoquista', 'Controle de estoque e movimentacoes', 'ATIVO'),
  ('55555555-5555-5555-5555-555555555555', 'Gerente', 'Visao gerencial e acompanhamento operacional', 'ATIVO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO perfil_permissoes (id, perfil_id, modulo, pode_criar, pode_ler, pode_atualizar, pode_excluir)
VALUES
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'clientes', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'fornecedores', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'produtos', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'vendas', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'estoque', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'financeiro', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'frota', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'relatorios', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'usuarios', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'clientes', FALSE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'vendas', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000013', '22222222-2222-2222-2222-222222222222', 'estoque', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000014', '33333333-3333-3333-3333-333333333333', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000015', '33333333-3333-3333-3333-333333333333', 'financeiro', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000026', '33333333-3333-3333-3333-333333333333', 'clientes.financial', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000016', '44444444-4444-4444-4444-444444444444', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000017', '44444444-4444-4444-4444-444444444444', 'estoque', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000018', '55555555-5555-5555-5555-555555555555', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000019', '55555555-5555-5555-5555-555555555555', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000020', '55555555-5555-5555-5555-555555555555', 'vendas', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000021', '55555555-5555-5555-5555-555555555555', 'estoque', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000022', '55555555-5555-5555-5555-555555555555', 'financeiro', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000023', '55555555-5555-5555-5555-555555555555', 'frota', FALSE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000024', '55555555-5555-5555-5555-555555555555', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000025', '55555555-5555-5555-5555-555555555555', 'dashboard', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000027', '55555555-5555-5555-5555-555555555555', 'clientes.financial', FALSE, TRUE, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, perfil_id, nome, email, senha_hash, telefone, status)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Administrador do Sistema',
    'admin@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990001',
    'ATIVO'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Carlos Vendas',
    'carlos.vendas@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990002',
    'ATIVO'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'Fernanda Financeiro',
    'fernanda.financeiro@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990003',
    'ATIVO'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'Marcio Estoque',
    'marcio.estoque@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990004',
    'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO fornecedores (
  id, tipo_pessoa, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual, email,
  telefone, contato_responsavel, cep, logradouro, numero, complemento, bairro, cidade, estado,
  observacoes, status
)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001', 'PJ', 'Agro Insumos Brasil LTDA', 'Agro Insumos Brasil',
    '12345678000101', '102938475', 'contato@agroinsumos.local', '6233010001', 'Paulo Mendes',
    '74000000', 'Avenida das Sementes', '1200', 'Galpao A', 'Distrito Industrial', 'Goiania', 'GO',
    'Fornecedor padrao de defensivos e sementes.', 'ATIVO'
  ),
  (
    'f0000000-0000-0000-0000-000000000002', 'PJ', 'Transportes Cerrado LTDA', 'Cerrado Log',
    '12345678000102', '564738291', 'operacao@cerradolog.local', '6233010002', 'Roberta Lima',
    '74000001', 'Rua do Transporte', '455', NULL, 'Setor Norte', 'Anapolis', 'GO',
    'Fornecedor utilizado como transportadora terceirizada.', 'ATIVO'
  ),
  (
    'f0000000-0000-0000-0000-000000000003', 'PJ', 'Oficina Mecanica Campo Forte LTDA', 'Campo Forte Oficina',
    '12345678000103', '111222333', 'servicos@campoforte.local', '6233010003', 'Joao Batista',
    '74000002', 'Rodovia GO-020', '900', NULL, 'Zona Rural', 'Senador Canedo', 'GO',
    'Prestador de servicos de manutencao de frota.', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO clientes (
  id, tipo_pessoa, nome_razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual, email,
  telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito, observacoes, status
)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001', 'PJ', 'Fazenda Boa Esperanca LTDA', 'Fazenda Boa Esperanca',
    '98765432000101', '998877665', 'compras@boaesperanca.local', '6234010001', '75900000',
    'Estrada Vicinal Km 12', 'S/N', NULL, 'Zona Rural', 'Rio Verde', 'GO', 50000.00,
    'Cliente recorrente com compras sazonais.', 'ATIVO'
  ),
  (
    'c0000000-0000-0000-0000-000000000002', 'PJ', 'Cooperativa Agro Vale', 'Coop Agro Vale',
    '98765432000102', '887766554', 'financeiro@agrovale.local', '6234010002', '75800000',
    'Avenida Central', '220', 'Sala 4', 'Centro', 'Jatai', 'GO', 120000.00,
    'Cliente com compras em volume e prazo.', 'ATIVO'
  ),
  (
    'c0000000-0000-0000-0000-000000000003', 'PF', 'Marcos Antonio Pereira', NULL,
    '12345678901', NULL, 'marcos.pereira@cliente.local', '6234010003', '75600000',
    'Rua das Palmeiras', '85', NULL, 'Setor Sul', 'Mineiros', 'GO', 8000.00,
    'Cliente de pronta entrega.', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO produtos (
  id, fornecedor_padrao_id, codigo, codigo_barras, referencia_interna, nome, descricao, unidade_medida,
  categoria, preco_custo, preco_venda, peso_kg, estoque_minimo, ponto_reposicao, permite_venda_sem_estoque, status
)
VALUES
  (
    'p0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0001', '7891000000011', 'SEMENTE-MILHO-20KG', 'Semente de Milho Hibrido 20kg',
    'Semente de milho hibrido para alta produtividade.', 'SACA', 'SEMENTES',
    210.00, 285.00, 20.000, 15.000, 30.000, FALSE, 'ATIVO'
  ),
  (
    'p0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0002', '7891000000012', 'FERT-NPK-50KG', 'Fertilizante NPK 04-14-08 50kg',
    'Fertilizante granulado para preparo de solo.', 'SACA', 'FERTILIZANTES',
    145.00, 198.00, 50.000, 20.000, 40.000, FALSE, 'ATIVO'
  ),
  (
    'p0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0003', '7891000000013', 'HERB-GLI-20L', 'Herbicida Glifosato 20L',
    'Herbicida sistemico para controle pos-emergente.', 'UN', 'DEFENSIVOS',
    320.00, 429.90, 22.000, 10.000, 25.000, FALSE, 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO locais_estoque (
  id, nome, codigo, descricao, tipo_local, endereco_referencia, status
)
VALUES
  (
    'l0000000-0000-0000-0000-000000000001', 'Deposito Central', 'DEP-CENTRAL',
    'Armazenamento principal de mercadorias.', 'DEPOSITO', 'Matriz - Goiania', 'ATIVO'
  ),
  (
    'l0000000-0000-0000-0000-000000000002', 'Filial Rio Verde', 'FIL-RIOVERDE',
    'Estoque da unidade de Rio Verde.', 'FILIAL', 'Unidade Rio Verde', 'ATIVO'
  ),
  (
    'l0000000-0000-0000-0000-000000000003', 'Prateleira A1', 'PRAT-A1',
    'Area de picking de itens leves.', 'PRATELEIRA', 'Deposito Central - Corredor A', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO estoques (
  id, produto_id, local_estoque_id, quantidade, reservado
)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000001', 80.000, 5.000
  ),
  (
    'e0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002',
    'l0000000-0000-0000-0000-000000000001', 60.000, 0.000
  ),
  (
    'e0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003',
    'l0000000-0000-0000-0000-000000000002', 25.000, 2.000
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO veiculos (
  id, placa, modelo, marca, ano_fabricacao, tipo_veiculo, capacidade_carga_kg,
  quilometragem_atual, responsavel_usuario_id, status
)
VALUES
  (
    'v0000000-0000-0000-0000-000000000001', 'ABC1D23', 'Delivery 9.170', 'Volkswagen',
    2022, 'CAMINHAO', 5000.000, 45200.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ATIVO'
  ),
  (
    'v0000000-0000-0000-0000-000000000002', 'EFG4H56', 'Master Furgao', 'Renault',
    2021, 'VAN', 1600.000, 37850.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO manutencoes (
  id, veiculo_id, fornecedor_id, tipo_manutencao, descricao, data_manutencao,
  proxima_manutencao_data, proxima_manutencao_km, quilometragem_registrada, custo, status
)
VALUES
  (
    'm0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000003', 'PREVENTIVA', 'Troca de oleo, filtros e revisao geral.',
    CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '160 days', 50000.0, 44800.0, 1450.00, 'CONCLUIDA'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendas (
  id, numero, cliente_id, vendedor_id, tipo_venda, status, forma_pagamento, condicao_pagamento,
  data_venda, data_faturamento, data_entrega_prevista, subtotal, desconto_valor, frete_valor, total_valor, observacoes
)
VALUES
  (
    'vd000000-0000-0000-0000-000000000001', 'VEN-2026-0001', 'c0000000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'NORMAL', 'CONFIRMADA', 'A_PRAZO', '30/60 dias',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', CURRENT_DATE + INTERVAL '2 days',
    2850.00, 150.00, 220.00, 2920.00, 'Venda com entrega agendada.'
  ),
  (
    'vd000000-0000-0000-0000-000000000002', 'VEN-2026-0002', 'c0000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DIRETA', 'FATURADA', 'PIX', 'Pagamento imediato',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', CURRENT_DATE,
    429.90, 0.00, 0.00, 429.90, 'Venda de balcão.'
  ),
  (
    'vd000000-0000-0000-0000-000000000003', 'VEN-2026-0003', 'c0000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'FUTURA', 'PENDENTE', 'A_PRAZO', '45 dias',
    NOW(), NULL, CURRENT_DATE + INTERVAL '15 days',
    3960.00, 160.00, 340.00, 4140.00, 'Venda futura para entrega programada.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO itens_venda (
  id, venda_id, produto_id, local_estoque_id, sequencia, quantidade, preco_unitario, desconto_valor, total_valor
)
VALUES
  (
    'iv000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000001',
    1, 10.000, 285.00, 150.00, 2700.00
  ),
  (
    'iv000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001',
    2, 1.000, 150.00, 0.00, 150.00
  ),
  (
    'iv000000-0000-0000-0000-000000000003', 'vd000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000002',
    1, 1.000, 429.90, 0.00, 429.90
  ),
  (
    'iv000000-0000-0000-0000-000000000004', 'vd000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001',
    1, 20.000, 198.00, 160.00, 3800.00
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO fretes (
  id, venda_id, modalidade, tipo_calculo, regiao_destino, peso_total_kg, distancia_km,
  valor_estimado, valor_real, veiculo_id, transportadora_fornecedor_id, observacoes
)
VALUES
  (
    'fr000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'PROPRIO', 'DISTANCIA', 'Rio Verde/GO', 250.000, 230.00,
    220.00, NULL, 'v0000000-0000-0000-0000-000000000001', NULL, 'Entrega com frota propria.'
  ),
  (
    'fr000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000003',
    'TERCEIRO', 'REGIAO', 'Jatai/GO', 1000.000, 320.00,
    340.00, NULL, NULL, 'f0000000-0000-0000-0000-000000000002', 'Entrega futura via transportadora.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO entregas (
  id, venda_id, frete_id, responsavel_usuario_id, status, data_saida,
  data_entrega_realizada, tentativa_atual, comprovante_recebimento, observacoes
)
VALUES
  (
    'en000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'fr000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'EM_TRANSITO',
    NOW() - INTERVAL '1 day', NULL, 1, NULL, 'Motorista em rota de entrega.'
  ),
  (
    'en000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000003',
    'fr000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AGUARDANDO_DESPACHO',
    NULL, NULL, 0, NULL, 'Separacao aguardando data de expedicao.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO historico_entregas (
  id, entrega_id, status, data_evento, observacao, usuario_id
)
VALUES
  (
    'he000000-0000-0000-0000-000000000001', 'en000000-0000-0000-0000-000000000001',
    'AGUARDANDO_DESPACHO', NOW() - INTERVAL '2 days', 'Pedido separado e aguardando liberacao.', 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ),
  (
    'he000000-0000-0000-0000-000000000002', 'en000000-0000-0000-0000-000000000001',
    'EM_TRANSITO', NOW() - INTERVAL '1 day', 'Carga expedida para o cliente.', 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ),
  (
    'he000000-0000-0000-0000-000000000003', 'en000000-0000-0000-0000-000000000002',
    'AGUARDANDO_DESPACHO', NOW(), 'Venda futura registrada e entrega ainda nao liberada.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO duplicatas (
  id, venda_id, cliente_id, numero, parcela, valor_total, valor_aberto, vencimento, data_emissao, status, observacoes
)
VALUES
  (
    'dp000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', 'DUP-2026-0001-01', 1, 1460.00, 0.00,
    CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days', 'PAGO',
    'Primeira parcela da venda VEN-2026-0001.'
  ),
  (
    'dp000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', 'DUP-2026-0001-02', 2, 1460.00, 1460.00,
    CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE - INTERVAL '10 days', 'EM_ABERTO',
    'Segunda parcela da venda VEN-2026-0001.'
  ),
  (
    'dp000000-0000-0000-0000-000000000003', 'vd000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002', 'DUP-2026-0003-01', 1, 4140.00, 4140.00,
    CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE, 'EM_ABERTO',
    'Duplicata gerada para venda futura.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO pagamentos (
  id, duplicata_id, recebido_por_usuario_id, forma_pagamento, valor, data_pagamento, referencia_externa, observacoes
)
VALUES
  (
    'pg000000-0000-0000-0000-000000000001', 'dp000000-0000-0000-0000-000000000001',
    'cccccccc-cccc-cccc-cccc-cccccccccccc', 'PIX', 1460.00, NOW() - INTERVAL '5 days',
    'PIX-E2E-0001', 'Pagamento integral recebido via PIX.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO movimentacoes_estoque (
  id, produto_id, local_origem_id, local_destino_id, usuario_id, venda_id,
  tipo_movimentacao, quantidade, motivo, observacoes, data_movimentacao
)
VALUES
  (
    'mv000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001',
    NULL, 'l0000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL,
    'ENTRADA', 80.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '30 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002',
    NULL, 'l0000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL,
    'ENTRADA', 60.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '28 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003',
    NULL, 'l0000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL,
    'ENTRADA', 25.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '25 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000001', NULL, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'vd000000-0000-0000-0000-000000000001',
    'SAIDA', 10.000, 'VENDA', 'Baixa referente a VEN-2026-0001.', NOW() - INTERVAL '9 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000003',
    'l0000000-0000-0000-0000-000000000002', NULL, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'vd000000-0000-0000-0000-000000000002',
    'SAIDA', 1.000, 'VENDA', 'Baixa referente a VEN-2026-0002.', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO logs_auditoria (
  id, usuario_id, tabela_nome, registro_id, acao, dados_anteriores, dados_novos, ip_origem, user_agent, criado_em
)
VALUES
  (
    'lg000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'usuarios',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'LOGIN', NULL,
    '{"status":"ATIVO","evento":"login"}'::jsonb, '127.0.0.1', 'seed-script', NOW() - INTERVAL '1 day'
  ),
  (
    'lg000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vendas',
    'vd000000-0000-0000-0000-000000000003', 'INSERT', NULL,
    '{"numero":"VEN-2026-0003","tipo_venda":"FUTURA","status":"PENDENTE"}'::jsonb, '127.0.0.1', 'seed-script', NOW()
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

```

---

## 11. Tratamento de Erros

Erros tratados no modulo:

- documento duplicado retorna `409`
- cliente inexistente retorna `404`
- payload invalido retorna `400`
- status invalido retorna `400`
- transicao de status inconsistente retorna `409`
- acesso sem token retorna `401`
- acesso sem permissao retorna `403`

---

## 12. Integracao com o Backend

A integracao principal ja foi feita em `backend/src/routes/index.js` com:

`router.use("/clientes", clienteRoutes);`

Para integrar no restante do ERP:

- mantenha as rotas sob o prefixo global `/api` definido no `app.js`;
- use o endpoint de historico de compras em dashboards comerciais e relatarios de relacionamento;
- use o endpoint de debitos em aberto nas telas de financeiro e analise de credito;
- em fluxos operacionais de venda, consulte apenas clientes `ATIVO` ou trate `BLOQUEADO` como restricao de negocio na camada de vendas.
