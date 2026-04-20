# CRUD de Fornecedores

## 1. Explicacao Curta da Implementacao

O modulo de fornecedores foi implementado em arquitetura `MSC`, com controllers enxutos, validacoes centralizadas, regras de negocio no service e acesso ao banco concentrado no model.

### Decisoes tecnicas principais

- A inativacao e logica via `PATCH /fornecedores/:id/inativar`, atualizando `status` para `INATIVO`.
- A duplicidade de `CNPJ/CPF` e validada antes de inserir ou atualizar.
- O documento e normalizado para apenas digitos e validado como `CPF` ou `CNPJ`.
- O endereco da API e exposto como objeto `endereco`, enquanto o banco continua com colunas separadas.
- O endpoint de historico de compras foi preparado com base na modelagem existente, usando os produtos vinculados ao fornecedor, sem inventar tabelas de compras inexistentes.
- Todas as rotas estao protegidas com autenticacao JWT e autorizacao por permissao.

---

## 2. Estrutura dos Arquivos

```txt
/backend/src
  /controllers
    fornecedorController.js
  /services
    fornecedorService.js
  /models
    fornecedorModel.js
  /routes
    fornecedorRoutes.js
    index.js
  /utils
    fornecedorValidation.js
    permissions.js
  /middlewares
    authMiddleware.js
    permissionMiddleware.js
```

---

## 3. Rotas Entregues e Protegidas

- `POST /api/fornecedores` com `fornecedores.create`
- `GET /api/fornecedores` com `fornecedores.read`
- `GET /api/fornecedores/:id` com `fornecedores.read`
- `PUT /api/fornecedores/:id` com `fornecedores.update`
- `PATCH /api/fornecedores/:id/inativar` com `fornecedores.inactivate`
- `GET /api/fornecedores/:id/historico-compras` com `fornecedores.read`

---

## 4. Validacoes Implementadas

- razao social obrigatoria
- CNPJ/CPF obrigatorio
- validacao real de CPF e CNPJ
- normalizacao do documento para apenas digitos
- validacao de duplicidade de documento
- validacao de e-mail quando enviado
- validacao de `status` com valores `ATIVO` e `INATIVO`
- validacao de UUID nas rotas com `:id`
- tratamento de fornecedor inexistente com `404`
- bloqueio de inativacao repetida com `409`

---

## 5. Exemplo de Payload de Criacao

```json
{
  "razao_social": "Agro Insumos Planalto LTDA",
  "nome_fantasia": "Planalto Insumos",
  "cnpj_cpf": "12.345.678/0001-90",
  "email": "contato@planaltoinsumos.com.br",
  "telefone": "(62) 3333-4444",
  "contato_responsavel": "Juliana Reis",
  "tipo_pessoa": "PJ",
  "endereco": {
    "cep": "74000-000",
    "logradouro": "Avenida Brasil",
    "numero": "1200",
    "complemento": "Sala 2",
    "bairro": "Centro",
    "cidade": "Goiania",
    "estado": "GO"
  },
  "observacoes": "Fornecedor homologado para linha de fertilizantes.",
  "status": "ATIVO"
}
```

## 6. Exemplo de Resposta da API

```json
{
  "status": "success",
  "message": "Fornecedor cadastrado com sucesso",
  "data": {
    "id": "c4f15f1e-92a4-4894-b655-c058fe8eb7f9",
    "tipo_pessoa": "PJ",
    "razao_social": "Agro Insumos Planalto LTDA",
    "nome_fantasia": "Planalto Insumos",
    "cnpj_cpf": "12345678000190",
    "inscricao_estadual": null,
    "email": "contato@planaltoinsumos.com.br",
    "telefone": "(62) 3333-4444",
    "contato_responsavel": "Juliana Reis",
    "endereco": {
      "cep": "74000-000",
      "logradouro": "Avenida Brasil",
      "numero": "1200",
      "complemento": "Sala 2",
      "bairro": "Centro",
      "cidade": "Goiania",
      "estado": "GO"
    },
    "observacoes": "Fornecedor homologado para linha de fertilizantes.",
    "status": "ATIVO",
    "created_at": "2026-04-19T18:00:00.000Z",
    "updated_at": "2026-04-19T18:00:00.000Z"
  }
}
```

## 7. Preparacao para Historico de Compras

O schema atual ainda nao possui modulo de compras com pedidos de compra, notas de entrada ou recebimentos por fornecedor. Por isso, o endpoint `GET /fornecedores/:id/historico-compras` foi entregue como estrutura preparada, retornando:

- dados basicos do fornecedor;
- resumo dos produtos vinculados por `fornecedor_padrao_id`;
- lista de produtos relacionados;
- campo `historico_compras` pronto para receber registros futuros;
- observacao explicita sobre a dependencia do futuro modulo de compras.

---

## 8. Codigo Completo dos Arquivos

### `backend/src/controllers/fornecedorController.js`

```javascript
const fornecedorService = require("../services/fornecedorService");

const createFornecedor = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.createFornecedor({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Fornecedor cadastrado com sucesso",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const listFornecedores = async (request, response, next) => {
  try {
    const result = await fornecedorService.listFornecedores(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getFornecedorById = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.getFornecedorById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const updateFornecedor = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.updateFornecedor({
      fornecedorId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Fornecedor atualizado com sucesso",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const inactivateFornecedor = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.inactivateFornecedor({
      fornecedorId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Fornecedor inativado com sucesso",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const getHistoricoCompras = async (request, response, next) => {
  try {
    const historico = await fornecedorService.getHistoricoCompras(request.params.id);

    return response.status(200).json({
      status: "success",
      data: historico
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFornecedor,
  listFornecedores,
  getFornecedorById,
  updateFornecedor,
  inactivateFornecedor,
  getHistoricoCompras
};

```

### `backend/src/services/fornecedorService.js`

```javascript
const fornecedorModel = require("../models/fornecedorModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseFornecedorPayload,
  parseListFilters,
  mapFornecedorResponse
} = require("../utils/fornecedorValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertFornecedorExists = async (fornecedorId) => {
  validateUuid(fornecedorId, "Fornecedor");

  const fornecedor = await fornecedorModel.findFornecedorById(fornecedorId);

  if (!fornecedor) {
    throw new AppError("Fornecedor nao encontrado", 404);
  }

  return fornecedor;
};

const ensureUniqueDocument = async (cnpjCpf, excludeId = null) => {
  const fornecedor = await fornecedorModel.findFornecedorByDocument(cnpjCpf, excludeId);

  if (fornecedor) {
    throw new AppError("Ja existe fornecedor cadastrado com este CNPJ/CPF", 409);
  }
};

const createFornecedor = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseFornecedorPayload(payload);

  await ensureUniqueDocument(parsedPayload.cnpjCpf);

  const fornecedor = await fornecedorModel.createFornecedor(parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: fornecedor.id,
    action: "INSERT",
    newData: {
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    ...metadata
  });

  return mapFornecedorResponse(fornecedor);
};

const listFornecedores = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [fornecedores, total] = await Promise.all([
    fornecedorModel.listFornecedores(filters),
    fornecedorModel.countFornecedores(filters)
  ]);

  return {
    items: fornecedores.map(mapFornecedorResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getFornecedorById = async (fornecedorId) => {
  const fornecedor = await assertFornecedorExists(fornecedorId);
  return mapFornecedorResponse(fornecedor);
};

const updateFornecedor = async ({
  fornecedorId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentFornecedor = await assertFornecedorExists(fornecedorId);
  const parsedPayload = parseFornecedorPayload(payload);

  await ensureUniqueDocument(parsedPayload.cnpjCpf, fornecedorId);

  const fornecedor = await fornecedorModel.updateFornecedor(fornecedorId, parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: fornecedor.id,
    action: "UPDATE",
    previousData: {
      razao_social: currentFornecedor.razao_social,
      cnpj_cpf: currentFornecedor.cpf_cnpj,
      status: currentFornecedor.status
    },
    newData: {
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    ...metadata
  });

  return mapFornecedorResponse(fornecedor);
};

const inactivateFornecedor = async ({
  fornecedorId,
  authenticatedUser,
  request
}) => {
  const currentFornecedor = await assertFornecedorExists(fornecedorId);

  if (currentFornecedor.status === "INATIVO") {
    throw new AppError("Fornecedor ja esta inativo", 409);
  }

  const fornecedor = await fornecedorModel.inactivateFornecedor(fornecedorId);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: fornecedor.id,
    action: "UPDATE",
    previousData: { status: currentFornecedor.status },
    newData: { status: fornecedor.status },
    ...metadata
  });

  return mapFornecedorResponse(fornecedor);
};

const getHistoricoCompras = async (fornecedorId) => {
  const fornecedor = await assertFornecedorExists(fornecedorId);
  const historico = await fornecedorModel.getFornecedorHistoricoCompras(fornecedorId);

  return {
    fornecedor: {
      id: fornecedor.id,
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    summary: {
      total_produtos_vinculados: historico.summary.total_produtos_vinculados,
      total_produtos_ativos: historico.summary.total_produtos_ativos,
      ultimo_produto_atualizado_em:
        historico.summary.ultimo_produto_atualizado_em,
      modulo_compras_disponivel: false
    },
    historico_compras: [],
    produtos_relacionados: historico.relatedProducts,
    observacao:
      "Estrutura preparada para historico de compras. O schema atual ainda nao possui tabelas de pedidos de compra/entradas por fornecedor."
  };
};

module.exports = {
  createFornecedor,
  listFornecedores,
  getFornecedorById,
  updateFornecedor,
  inactivateFornecedor,
  getHistoricoCompras
};

```

### `backend/src/models/fornecedorModel.js`

```javascript
const { query } = require("../config/database");

const supplierSelect = `
  SELECT
    id,
    tipo_pessoa,
    razao_social,
    nome_fantasia,
    cpf_cnpj,
    inscricao_estadual,
    email,
    telefone,
    contato_responsavel,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    observacoes,
    status,
    criado_em AS created_at,
    atualizado_em AS updated_at
  FROM fornecedores
`;

const createFornecedor = async (payload) => {
  const result = await query(
    `
      INSERT INTO fornecedores (
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING
        id,
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.tipoPessoa,
      payload.razaoSocial,
      payload.nomeFantasia,
      payload.cnpjCpf,
      payload.inscricaoEstadual,
      payload.email,
      payload.telefone,
      payload.contatoResponsavel,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.observacoes,
      payload.status
    ]
  );

  return result.rows[0];
};

const findFornecedorById = async (fornecedorId) => {
  const result = await query(
    `
      ${supplierSelect}
      WHERE id = $1
      LIMIT 1
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const findFornecedorByDocument = async (cnpjCpf, excludeId = null) => {
  const result = await query(
    `
      SELECT id, cpf_cnpj
      FROM fornecedores
      WHERE cpf_cnpj = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [cnpjCpf, excludeId]
  );

  return result.rows[0] || null;
};

const listFornecedores = async ({ status, search, limit, offset }) => {
  const result = await query(
    `
      ${supplierSelect}
      WHERE ($1::varchar IS NULL OR status = $1)
        AND (
          $2::varchar IS NULL
          OR razao_social ILIKE '%' || $2 || '%'
          OR COALESCE(nome_fantasia, '') ILIKE '%' || $2 || '%'
          OR cpf_cnpj ILIKE '%' || $2 || '%'
        )
      ORDER BY razao_social ASC
      LIMIT $3 OFFSET $4
    `,
    [status, search, limit, offset]
  );

  return result.rows;
};

const countFornecedores = async ({ status, search }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM fornecedores
      WHERE ($1::varchar IS NULL OR status = $1)
        AND (
          $2::varchar IS NULL
          OR razao_social ILIKE '%' || $2 || '%'
          OR COALESCE(nome_fantasia, '') ILIKE '%' || $2 || '%'
          OR cpf_cnpj ILIKE '%' || $2 || '%'
        )
    `,
    [status, search]
  );

  return result.rows[0].total;
};

const updateFornecedor = async (fornecedorId, payload) => {
  const result = await query(
    `
      UPDATE fornecedores
      SET
        tipo_pessoa = $2,
        razao_social = $3,
        nome_fantasia = $4,
        cpf_cnpj = $5,
        inscricao_estadual = $6,
        email = $7,
        telefone = $8,
        contato_responsavel = $9,
        cep = $10,
        logradouro = $11,
        numero = $12,
        complemento = $13,
        bairro = $14,
        cidade = $15,
        estado = $16,
        observacoes = $17,
        status = $18,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      fornecedorId,
      payload.tipoPessoa,
      payload.razaoSocial,
      payload.nomeFantasia,
      payload.cnpjCpf,
      payload.inscricaoEstadual,
      payload.email,
      payload.telefone,
      payload.contatoResponsavel,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.observacoes,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const inactivateFornecedor = async (fornecedorId) => {
  const result = await query(
    `
      UPDATE fornecedores
      SET status = 'INATIVO', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const getFornecedorHistoricoCompras = async (fornecedorId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_produtos_vinculados,
        COUNT(*) FILTER (WHERE status = 'ATIVO')::integer AS total_produtos_ativos,
        MAX(atualizado_em) AS ultimo_produto_atualizado_em
      FROM produtos
      WHERE fornecedor_padrao_id = $1
    `,
    [fornecedorId]
  );

  const relatedProductsResult = await query(
    `
      SELECT
        id,
        codigo,
        nome,
        categoria,
        preco_custo,
        preco_venda,
        status,
        atualizado_em AS updated_at
      FROM produtos
      WHERE fornecedor_padrao_id = $1
      ORDER BY nome ASC
      LIMIT 20
    `,
    [fornecedorId]
  );

  return {
    summary: summaryResult.rows[0],
    relatedProducts: relatedProductsResult.rows
  };
};

module.exports = {
  createFornecedor,
  findFornecedorById,
  findFornecedorByDocument,
  listFornecedores,
  countFornecedores,
  updateFornecedor,
  inactivateFornecedor,
  getFornecedorHistoricoCompras
};

```

### `backend/src/routes/fornecedorRoutes.js`

```javascript
const express = require("express");

const fornecedorController = require("../controllers/fornecedorController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  permissionMiddleware("fornecedores.create"),
  fornecedorController.createFornecedor
);

router.get(
  "/",
  permissionMiddleware("fornecedores.read"),
  fornecedorController.listFornecedores
);

router.get(
  "/:id",
  permissionMiddleware("fornecedores.read"),
  fornecedorController.getFornecedorById
);

router.put(
  "/:id",
  permissionMiddleware("fornecedores.update"),
  fornecedorController.updateFornecedor
);

router.patch(
  "/:id/inativar",
  permissionMiddleware("fornecedores.inactivate"),
  fornecedorController.inactivateFornecedor
);

router.get(
  "/:id/historico-compras",
  permissionMiddleware("fornecedores.read"),
  fornecedorController.getHistoricoCompras
);

module.exports = router;

```

### `backend/src/utils/fornecedorValidation.js`

```javascript
const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ATIVO", "INATIVO"];
const VALID_TIPO_PESSOA = ["PF", "PJ"];

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
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
    throw new AppError("CNPJ/CPF obrigatorio", 400);
  }

  const isValid =
    (digits.length === 11 && validateCpf(digits)) ||
    (digits.length === 14 && validateCnpj(digits));

  if (!isValid) {
    throw new AppError("CNPJ/CPF invalido", 400);
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

const parseFornecedorPayload = (payload, { partial = false } = {}) => {
  const razaoSocial = sanitizeString(payload.razao_social);
  const nomeFantasia = sanitizeString(payload.nome_fantasia);
  const cnpjCpf = payload.cnpj_cpf !== undefined ? validateDocument(payload.cnpj_cpf) : null;
  const email = sanitizeString(payload.email);
  const contatoResponsavel = sanitizeString(payload.contato_responsavel);
  const tipoPessoa = sanitizeString(payload.tipo_pessoa) || null;
  const status = sanitizeString(payload.status) || null;
  const endereco = normalizeEndereco(payload.endereco || {});

  if (!partial || payload.razao_social !== undefined) {
    if (!razaoSocial) {
      throw new AppError("Razao social obrigatoria", 400);
    }
  }

  if (!partial || payload.cnpj_cpf !== undefined) {
    if (!cnpjCpf) {
      throw new AppError("CNPJ/CPF obrigatorio", 400);
    }
  }

  validateEmail(email);

  const resolvedTipoPessoa =
    tipoPessoa || (cnpjCpf && cnpjCpf.length === 11 ? "PF" : "PJ");

  if (resolvedTipoPessoa && !VALID_TIPO_PESSOA.includes(resolvedTipoPessoa)) {
    throw new AppError("Tipo de pessoa invalido", 400);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para fornecedor", 400);
  }

  return {
    tipoPessoa: resolvedTipoPessoa,
    razaoSocial,
    nomeFantasia,
    cnpjCpf,
    inscricaoEstadual: sanitizeString(payload.inscricao_estadual),
    email,
    telefone: sanitizeString(payload.telefone),
    contatoResponsavel,
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

const parseListFilters = (query) => {
  const status = sanitizeString(query.status);
  const search = sanitizeString(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

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
    offset: (page - 1) * limit
  };
};

const mapFornecedorResponse = (fornecedor) => ({
  id: fornecedor.id,
  tipo_pessoa: fornecedor.tipo_pessoa,
  razao_social: fornecedor.razao_social,
  nome_fantasia: fornecedor.nome_fantasia,
  cnpj_cpf: fornecedor.cpf_cnpj,
  inscricao_estadual: fornecedor.inscricao_estadual,
  email: fornecedor.email,
  telefone: fornecedor.telefone,
  contato_responsavel: fornecedor.contato_responsavel,
  endereco: {
    cep: fornecedor.cep,
    logradouro: fornecedor.logradouro,
    numero: fornecedor.numero,
    complemento: fornecedor.complemento,
    bairro: fornecedor.bairro,
    cidade: fornecedor.cidade,
    estado: fornecedor.estado
  },
  observacoes: fornecedor.observacoes,
  status: fornecedor.status,
  created_at: fornecedor.created_at,
  updated_at: fornecedor.updated_at
});

module.exports = {
  validateUuid,
  parseFornecedorPayload,
  parseListFilters,
  mapFornecedorResponse
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
  inactivate: "pode_atualizar"
};

const normalizePermission = (permission) => {
  const [module, action] = permission.split(".");

  return {
    module,
    action,
    column: ACTION_TO_COLUMN[action],
    resolvedAction: action === "inactivate" ? "update" : action
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
router.use("/fornecedores", fornecedorRoutes);

module.exports = router;

```

---

## 9. Tratamento de Erros

Erros tratados no modulo:

- documento duplicado retorna `409`
- fornecedor inexistente retorna `404`
- payload invalido retorna `400`
- inativacao repetida retorna `409`
- acesso sem token retorna `401`
- acesso sem permissao retorna `403`

---

## 10. Integracao com o Backend

A integracao principal ja foi feita em `backend/src/routes/index.js` com:

`router.use("/fornecedores", fornecedorRoutes);`

Para integrar no restante do ERP:

- mantenha as rotas sob o prefixo global `/api` definido no `app.js`;
- proteja novos endpoints do modulo com `authMiddleware` e `permissionMiddleware`;
- quando o modulo de compras for criado, reaproveite o endpoint de historico para ler tabelas reais de compras por fornecedor.
