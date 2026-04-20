# CRUD de Produtos

## 1. Explicacao Curta da Implementacao

O modulo de produtos foi implementado em arquitetura `MSC`, mantendo controller fino, service com regra de negocio, model com SQL explicito e validacoes centralizadas em utilitarios.

### Decisoes tecnicas principais

- o CRUD usa inativacao logica via `PATCH /produtos/:id/inativar`;
- o fornecedor padrao e validado contra a tabela `fornecedores` antes de gravar;
- codigo e codigo de barras possuem checagem de unicidade;
- a listagem padrao exclui produtos `INATIVO`, salvo filtro explicito ou `include_inativos=true`;
- o saldo de estoque consolidado usa a tabela `estoques` por produto e por local;
- os alertas de estoque minimo e ponto de reposicao usam leitura real do saldo disponivel e retornam `ESTOQUE_MINIMO` ou `PONTO_REPOSICAO`.

---

## 2. Estrutura dos Arquivos

```txt
/backend/src
  /controllers
    produtoController.js
  /services
    produtoService.js
  /models
    produtoModel.js
  /routes
    produtoRoutes.js
    index.js
  /utils
    produtoValidation.js
    permissions.js
  /middlewares
    authMiddleware.js
    permissionMiddleware.js
```

---

## 3. Rotas Entregues e Protegidas

- `POST /api/produtos` com `produtos.create`
- `GET /api/produtos` com `produtos.read`
- `GET /api/produtos/:id` com `produtos.read`
- `PUT /api/produtos/:id` com `produtos.update`
- `PATCH /api/produtos/:id/inativar` com `produtos.inactivate`
- `GET /api/produtos/status/:status` com `produtos.read`
- `GET /api/produtos/categoria/:categoria` com `produtos.read`
- `GET /api/produtos/:id/saldo-estoque` com `produtos.read` na rota e `produtos.stock.read` na regra de negocio
- `GET /api/produtos/alertas/estoque-minimo` com `produtos.read` na rota e `produtos.stock.read` na regra de negocio

---

## 4. Validacoes Implementadas

- codigo obrigatorio
- nome obrigatorio
- duplicidade de codigo
- duplicidade de codigo de barras quando informado
- validacao de `fornecedor_padrao_id` como UUID
- validacao de existencia do fornecedor padrao
- validacao de `preco_custo`, `preco_venda`, `peso`, `estoque_minimo` e `ponto_reposicao` como numeros validos e nao negativos
- validacao de status aceitando apenas `ATIVO` e `INATIVO`
- tratamento de produto inexistente com `404`
- bloqueio de inativacao repetida com `409`

---

## 5. Exemplo de Payload de Criacao

```json
{
  "codigo": "PROD-0100",
  "nome": "Adjuvante Agricola 5L",
  "descricao": "Adjuvante para aplicacao foliar.",
  "unidade_medida": "UN",
  "categoria": "DEFENSIVOS",
  "preco_custo": 85.5,
  "preco_venda": 119.9,
  "peso": 5.2,
  "codigo_barras": "7891000000999",
  "referencia_interna": "ADJ-5L",
  "fornecedor_padrao_id": "f0000000-0000-0000-0000-000000000001",
  "estoque_minimo": 10,
  "ponto_reposicao": 20,
  "permite_venda_sem_estoque": false,
  "status": "ATIVO"
}
```

## 6. Exemplo de Payload de Atualizacao

```json
{
  "codigo": "PROD-0100",
  "nome": "Adjuvante Agricola Premium 5L",
  "descricao": "Adjuvante premium para aplicacao foliar.",
  "unidade_medida": "UN",
  "categoria": "DEFENSIVOS",
  "preco_custo": 90.0,
  "preco_venda": 129.9,
  "peso": 5.2,
  "codigo_barras": "7891000000999",
  "referencia_interna": "ADJ-5L-PREMIUM",
  "fornecedor_padrao_id": "f0000000-0000-0000-0000-000000000001",
  "estoque_minimo": 12,
  "ponto_reposicao": 24,
  "permite_venda_sem_estoque": false,
  "status": "ATIVO"
}
```

## 7. Exemplo de Resposta da API

```json
{
  "status": "success",
  "message": "Produto cadastrado com sucesso",
  "data": {
    "id": "8f4b851b-d998-4c6f-9443-d2fdfece8c35",
    "codigo": "PROD-0100",
    "nome": "Adjuvante Agricola 5L",
    "descricao": "Adjuvante para aplicacao foliar.",
    "unidade_medida": "UN",
    "categoria": "DEFENSIVOS",
    "preco_custo": "85.50",
    "preco_venda": "119.90",
    "peso": "5.200",
    "codigo_barras": "7891000000999",
    "referencia_interna": "ADJ-5L",
    "fornecedor_padrao_id": "f0000000-0000-0000-0000-000000000001",
    "fornecedor_padrao": {
      "id": "f0000000-0000-0000-0000-000000000001",
      "razao_social": "Agro Insumos Brasil LTDA"
    },
    "estoque_minimo": "10.000",
    "ponto_reposicao": "20.000",
    "permite_venda_sem_estoque": false,
    "status": "ATIVO",
    "created_at": "2026-04-19T20:00:00.000Z",
    "updated_at": "2026-04-19T20:00:00.000Z"
  }
}
```

## 8. Estrutura para Saldo de Estoque Consolidado por Produto

O endpoint `GET /produtos/:id/saldo-estoque` retorna:

- dados basicos do produto;
- `saldo_total`;
- `reservado_total`;
- `disponivel_total`;
- saldos por local com quantidade, reservado e disponivel.

## 9. Estrutura para Alertas de Estoque Minimo e Ponto de Reposicao

O endpoint `GET /produtos/alertas/estoque-minimo` retorna:

- total de alertas;
- lista de produtos ativos em risco;
- saldo total, reservado e disponivel;
- tipo de alerta identificado como `ESTOQUE_MINIMO` ou `PONTO_REPOSICAO`.

---

## 10. Codigo Completo dos Arquivos

### `backend/src/controllers/produtoController.js`

```javascript
const produtoService = require("../services/produtoService");

const createProduto = async (request, response, next) => {
  try {
    const produto = await produtoService.createProduto({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Produto cadastrado com sucesso",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const listProdutos = async (request, response, next) => {
  try {
    const result = await produtoService.listProdutos(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getProdutoById = async (request, response, next) => {
  try {
    const produto = await produtoService.getProdutoById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduto = async (request, response, next) => {
  try {
    const produto = await produtoService.updateProduto({
      produtoId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Produto atualizado com sucesso",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const inactivateProduto = async (request, response, next) => {
  try {
    const produto = await produtoService.inactivateProduto({
      produtoId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Produto inativado com sucesso",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const listProdutosByStatus = async (request, response, next) => {
  try {
    const result = await produtoService.listProdutosByStatus(request.params.status);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listProdutosByCategoria = async (request, response, next) => {
  try {
    const result = await produtoService.listProdutosByCategoria(
      request.params.categoria
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getSaldoEstoque = async (request, response, next) => {
  try {
    const saldo = await produtoService.getSaldoEstoque({
      produtoId: request.params.id,
      authenticatedUser: request.user
    });

    return response.status(200).json({
      status: "success",
      data: saldo
    });
  } catch (error) {
    return next(error);
  }
};

const getAlertasEstoqueMinimo = async (request, response, next) => {
  try {
    const result = await produtoService.getAlertasEstoqueMinimo({
      authenticatedUser: request.user
    });

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduto,
  listProdutos,
  getProdutoById,
  updateProduto,
  inactivateProduto,
  listProdutosByStatus,
  listProdutosByCategoria,
  getSaldoEstoque,
  getAlertasEstoqueMinimo
};

```

### `backend/src/services/produtoService.js`

```javascript
const produtoModel = require("../models/produtoModel");
const auditLogModel = require("../models/auditLogModel");
const authService = require("./authService");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseProdutoPayload,
  parseListFilters,
  mapProdutoResponse
} = require("../utils/produtoValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertProdutoExists = async (produtoId) => {
  validateUuid(produtoId, "Produto");

  const produto = await produtoModel.findProdutoById(produtoId);

  if (!produto) {
    throw new AppError("Produto nao encontrado", 404);
  }

  return produto;
};

const ensureUniqueCodigo = async (codigo, excludeId = null) => {
  const produto = await produtoModel.findProdutoByCodigo(codigo, excludeId);

  if (produto) {
    throw new AppError("Ja existe produto cadastrado com este codigo", 409);
  }
};

const ensureUniqueCodigoBarras = async (codigoBarras, excludeId = null) => {
  if (!codigoBarras) {
    return;
  }

  const produto = await produtoModel.findProdutoByCodigoBarras(
    codigoBarras,
    excludeId
  );

  if (produto) {
    throw new AppError("Ja existe produto cadastrado com este codigo de barras", 409);
  }
};

const validateFornecedorPadrao = async (fornecedorPadraoId) => {
  if (!fornecedorPadraoId) {
    return null;
  }

  const fornecedor = await produtoModel.findFornecedorById(fornecedorPadraoId);

  if (!fornecedor) {
    throw new AppError("Fornecedor padrao nao encontrado", 404);
  }

  return fornecedor;
};

const createProduto = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseProdutoPayload(payload);

  await Promise.all([
    ensureUniqueCodigo(parsedPayload.codigo),
    ensureUniqueCodigoBarras(parsedPayload.codigoBarras),
    validateFornecedorPadrao(parsedPayload.fornecedorPadraoId)
  ]);

  const produto = await produtoModel.createProduto(parsedPayload);
  const produtoCompleto = await produtoModel.findProdutoById(produto.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "produtos",
    recordId: produto.id,
    action: "INSERT",
    newData: {
      codigo: produto.codigo,
      nome: produto.nome,
      status: produto.status
    },
    ...metadata
  });

  return mapProdutoResponse(produtoCompleto);
};

const listProdutos = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [produtos, total] = await Promise.all([
    produtoModel.listProdutos(filters),
    produtoModel.countProdutos(filters)
  ]);

  return {
    items: produtos.map(mapProdutoResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getProdutoById = async (produtoId) => {
  const produto = await assertProdutoExists(produtoId);
  return mapProdutoResponse(produto);
};

const updateProduto = async ({
  produtoId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentProduto = await assertProdutoExists(produtoId);
  const parsedPayload = parseProdutoPayload(payload);

  await Promise.all([
    ensureUniqueCodigo(parsedPayload.codigo, produtoId),
    ensureUniqueCodigoBarras(parsedPayload.codigoBarras, produtoId),
    validateFornecedorPadrao(parsedPayload.fornecedorPadraoId)
  ]);

  const produto = await produtoModel.updateProduto(produtoId, parsedPayload);
  const produtoCompleto = await produtoModel.findProdutoById(produto.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "produtos",
    recordId: produto.id,
    action: "UPDATE",
    previousData: {
      codigo: currentProduto.codigo,
      nome: currentProduto.nome,
      status: currentProduto.status
    },
    newData: {
      codigo: produto.codigo,
      nome: produto.nome,
      status: produto.status
    },
    ...metadata
  });

  return mapProdutoResponse(produtoCompleto);
};

const inactivateProduto = async ({
  produtoId,
  authenticatedUser,
  request
}) => {
  const currentProduto = await assertProdutoExists(produtoId);

  if (currentProduto.status === "INATIVO") {
    throw new AppError("Produto ja esta inativo", 409);
  }

  const produto = await produtoModel.inactivateProduto(produtoId);
  const produtoCompleto = await produtoModel.findProdutoById(produto.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "produtos",
    recordId: produto.id,
    action: "UPDATE",
    previousData: { status: currentProduto.status },
    newData: { status: produto.status },
    ...metadata
  });

  return mapProdutoResponse(produtoCompleto);
};

const listProdutosByStatus = async (status) =>
  listProdutos({ status, page: 1, limit: 100, include_inativos: "true" });

const listProdutosByCategoria = async (categoria) =>
  listProdutos({ categoria, page: 1, limit: 100 });

const getSaldoEstoque = async ({ produtoId, authenticatedUser }) => {
  authService.ensurePermission(authenticatedUser, "produtos.stock.read");

  const produto = await assertProdutoExists(produtoId);
  const saldo = await produtoModel.getSaldoEstoqueByProdutoId(produtoId);

  return {
    produto: {
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      status: produto.status,
      estoque_minimo: produto.estoque_minimo,
      ponto_reposicao: produto.ponto_reposicao
    },
    saldo_consolidado: saldo.summary,
    saldos_por_local: saldo.stockByLocation
  };
};

const getAlertasEstoqueMinimo = async ({ authenticatedUser }) => {
  authService.ensurePermission(authenticatedUser, "produtos.stock.read");

  const produtos = await produtoModel.getProdutosAlertaEstoqueMinimo();

  return {
    total_alertas: produtos.length,
    alertas: produtos
  };
};

module.exports = {
  createProduto,
  listProdutos,
  getProdutoById,
  updateProduto,
  inactivateProduto,
  listProdutosByStatus,
  listProdutosByCategoria,
  getSaldoEstoque,
  getAlertasEstoqueMinimo
};

```

### `backend/src/models/produtoModel.js`

```javascript
const { query } = require("../config/database");

const productSelect = `
  SELECT
    p.id,
    p.fornecedor_padrao_id,
    p.codigo,
    p.codigo_barras,
    p.referencia_interna,
    p.nome,
    p.descricao,
    p.unidade_medida,
    p.categoria,
    p.preco_custo,
    p.preco_venda,
    p.peso_kg,
    p.estoque_minimo,
    p.ponto_reposicao,
    p.permite_venda_sem_estoque,
    p.status,
    p.criado_em AS created_at,
    p.atualizado_em AS updated_at,
    f.razao_social AS fornecedor_padrao_razao_social
  FROM produtos p
  LEFT JOIN fornecedores f ON f.id = p.fornecedor_padrao_id
`;

const createProduto = async (payload) => {
  const result = await query(
    `
      INSERT INTO produtos (
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING
        id,
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.fornecedorPadraoId,
      payload.codigo,
      payload.codigoBarras,
      payload.referenciaInterna,
      payload.nome,
      payload.descricao,
      payload.unidadeMedida,
      payload.categoria,
      payload.precoCusto,
      payload.precoVenda,
      payload.peso,
      payload.estoqueMinimo,
      payload.pontoReposicao,
      payload.permiteVendaSemEstoque,
      payload.status
    ]
  );

  return result.rows[0];
};

const findProdutoById = async (produtoId) => {
  const result = await query(
    `
      ${productSelect}
      WHERE p.id = $1
      LIMIT 1
    `,
    [produtoId]
  );

  return result.rows[0] || null;
};

const findProdutoByCodigo = async (codigo, excludeId = null) => {
  const result = await query(
    `
      SELECT id, codigo
      FROM produtos
      WHERE codigo = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [codigo, excludeId]
  );

  return result.rows[0] || null;
};

const findProdutoByCodigoBarras = async (codigoBarras, excludeId = null) => {
  if (!codigoBarras) {
    return null;
  }

  const result = await query(
    `
      SELECT id, codigo_barras
      FROM produtos
      WHERE codigo_barras = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [codigoBarras, excludeId]
  );

  return result.rows[0] || null;
};

const findFornecedorById = async (fornecedorId) => {
  if (!fornecedorId) {
    return null;
  }

  const result = await query(
    `
      SELECT id, razao_social, status
      FROM fornecedores
      WHERE id = $1
      LIMIT 1
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const listProdutos = async ({
  status,
  categoria,
  search,
  limit,
  offset,
  includeInactive
}) => {
  const result = await query(
    `
      ${productSelect}
      WHERE (
        (
          $1::varchar IS NOT NULL AND p.status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $5::boolean = TRUE
            OR p.status <> 'INATIVO'
          )
        )
      )
      AND ($2::varchar IS NULL OR p.categoria = $2)
      AND (
        $3::varchar IS NULL
        OR p.nome ILIKE '%' || $3 || '%'
        OR p.codigo ILIKE '%' || $3 || '%'
        OR COALESCE(p.codigo_barras, '') ILIKE '%' || $3 || '%'
        OR COALESCE(p.referencia_interna, '') ILIKE '%' || $3 || '%'
      )
      ORDER BY p.nome ASC
      LIMIT $4 OFFSET $6
    `,
    [status, categoria, search, limit, includeInactive, offset]
  );

  return result.rows;
};

const countProdutos = async ({
  status,
  categoria,
  search,
  includeInactive
}) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM produtos p
      WHERE (
        (
          $1::varchar IS NOT NULL AND p.status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $4::boolean = TRUE
            OR p.status <> 'INATIVO'
          )
        )
      )
      AND ($2::varchar IS NULL OR p.categoria = $2)
      AND (
        $3::varchar IS NULL
        OR p.nome ILIKE '%' || $3 || '%'
        OR p.codigo ILIKE '%' || $3 || '%'
        OR COALESCE(p.codigo_barras, '') ILIKE '%' || $3 || '%'
        OR COALESCE(p.referencia_interna, '') ILIKE '%' || $3 || '%'
      )
    `,
    [status, categoria, search, includeInactive]
  );

  return result.rows[0].total;
};

const updateProduto = async (produtoId, payload) => {
  const result = await query(
    `
      UPDATE produtos
      SET
        fornecedor_padrao_id = $2,
        codigo = $3,
        codigo_barras = $4,
        referencia_interna = $5,
        nome = $6,
        descricao = $7,
        unidade_medida = $8,
        categoria = $9,
        preco_custo = $10,
        preco_venda = $11,
        peso_kg = $12,
        estoque_minimo = $13,
        ponto_reposicao = $14,
        permite_venda_sem_estoque = $15,
        status = $16,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      produtoId,
      payload.fornecedorPadraoId,
      payload.codigo,
      payload.codigoBarras,
      payload.referenciaInterna,
      payload.nome,
      payload.descricao,
      payload.unidadeMedida,
      payload.categoria,
      payload.precoCusto,
      payload.precoVenda,
      payload.peso,
      payload.estoqueMinimo,
      payload.pontoReposicao,
      payload.permiteVendaSemEstoque,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const inactivateProduto = async (produtoId) => {
  const result = await query(
    `
      UPDATE produtos
      SET status = 'INATIVO', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [produtoId]
  );

  return result.rows[0] || null;
};

const getSaldoEstoqueByProdutoId = async (produtoId) => {
  const summaryResult = await query(
    `
      SELECT
        COALESCE(SUM(quantidade), 0)::numeric(14,3) AS saldo_total,
        COALESCE(SUM(reservado), 0)::numeric(14,3) AS reservado_total,
        COALESCE(SUM(quantidade - reservado), 0)::numeric(14,3) AS disponivel_total
      FROM estoques
      WHERE produto_id = $1
    `,
    [produtoId]
  );

  const stockByLocationResult = await query(
    `
      SELECT
        e.id,
        e.local_estoque_id,
        l.codigo AS local_codigo,
        l.nome AS local_nome,
        e.quantidade,
        e.reservado,
        (e.quantidade - e.reservado)::numeric(14,3) AS disponivel
      FROM estoques e
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE e.produto_id = $1
      ORDER BY l.nome ASC
    `,
    [produtoId]
  );

  return {
    summary: summaryResult.rows[0],
    stockByLocation: stockByLocationResult.rows
  };
};

const getProdutosAlertaEstoqueMinimo = async () => {
  const result = await query(
    `
      SELECT
        p.id,
        p.codigo,
        p.nome,
        p.categoria,
        p.unidade_medida,
        p.status,
        p.estoque_minimo,
        p.ponto_reposicao,
        COALESCE(SUM(e.quantidade), 0)::numeric(14,3) AS saldo_total,
        COALESCE(SUM(e.reservado), 0)::numeric(14,3) AS reservado_total,
        COALESCE(SUM(e.quantidade - e.reservado), 0)::numeric(14,3) AS disponivel_total,
        CASE
          WHEN COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.estoque_minimo THEN 'ESTOQUE_MINIMO'
          WHEN COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.ponto_reposicao THEN 'PONTO_REPOSICAO'
          ELSE NULL
        END AS tipo_alerta
      FROM produtos p
      LEFT JOIN estoques e ON e.produto_id = p.id
      WHERE p.status = 'ATIVO'
      GROUP BY
        p.id,
        p.codigo,
        p.nome,
        p.categoria,
        p.unidade_medida,
        p.status,
        p.estoque_minimo,
        p.ponto_reposicao
      HAVING
        COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.ponto_reposicao
        OR COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.estoque_minimo
      ORDER BY disponivel_total ASC, p.nome ASC
    `
  );

  return result.rows;
};

module.exports = {
  createProduto,
  findProdutoById,
  findProdutoByCodigo,
  findProdutoByCodigoBarras,
  findFornecedorById,
  listProdutos,
  countProdutos,
  updateProduto,
  inactivateProduto,
  getSaldoEstoqueByProdutoId,
  getProdutosAlertaEstoqueMinimo
};

```

### `backend/src/routes/produtoRoutes.js`

```javascript
const express = require("express");

const produtoController = require("../controllers/produtoController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/alertas/estoque-minimo",
  permissionMiddleware("produtos.read"),
  produtoController.getAlertasEstoqueMinimo
);

router.get(
  "/status/:status",
  permissionMiddleware("produtos.read"),
  produtoController.listProdutosByStatus
);

router.get(
  "/categoria/:categoria",
  permissionMiddleware("produtos.read"),
  produtoController.listProdutosByCategoria
);

router.post(
  "/",
  permissionMiddleware("produtos.create"),
  produtoController.createProduto
);

router.get(
  "/",
  permissionMiddleware("produtos.read"),
  produtoController.listProdutos
);

router.get(
  "/:id/saldo-estoque",
  permissionMiddleware("produtos.read"),
  produtoController.getSaldoEstoque
);

router.get(
  "/:id",
  permissionMiddleware("produtos.read"),
  produtoController.getProdutoById
);

router.put(
  "/:id",
  permissionMiddleware("produtos.update"),
  produtoController.updateProduto
);

router.patch(
  "/:id/inativar",
  permissionMiddleware("produtos.inactivate"),
  produtoController.inactivateProduto
);

module.exports = router;

```

### `backend/src/utils/produtoValidation.js`

```javascript
const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUS = ["ATIVO", "INATIVO"];

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

const parseProdutoPayload = (payload, { allowStatus = true } = {}) => {
  const codigo = sanitizeString(payload.codigo);
  const nome = sanitizeString(payload.nome);
  const status = sanitizeString(payload.status) || null;

  if (!codigo) {
    throw new AppError("Codigo obrigatorio", 400);
  }

  if (!nome) {
    throw new AppError("Nome obrigatorio", 400);
  }

  if (status && !allowStatus) {
    throw new AppError("Status nao pode ser alterado neste endpoint", 400);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para produto", 400);
  }

  const fornecedorPadraoId = sanitizeString(payload.fornecedor_padrao_id);

  if (fornecedorPadraoId) {
    validateUuid(fornecedorPadraoId, "Fornecedor padrao");
  }

  return {
    codigo,
    nome,
    descricao: sanitizeString(payload.descricao),
    unidadeMedida: sanitizeString(payload.unidade_medida),
    categoria: sanitizeString(payload.categoria),
    precoCusto: sanitizeNumber(payload.preco_custo, "Preco de custo"),
    precoVenda: sanitizeNumber(payload.preco_venda, "Preco de venda"),
    peso: sanitizeNumber(payload.peso, "Peso"),
    codigoBarras: sanitizeString(payload.codigo_barras),
    referenciaInterna: sanitizeString(payload.referencia_interna),
    fornecedorPadraoId,
    estoqueMinimo: sanitizeNumber(payload.estoque_minimo, "Estoque minimo"),
    pontoReposicao: sanitizeNumber(
      payload.ponto_reposicao,
      "Ponto de reposicao"
    ),
    permiteVendaSemEstoque: Boolean(payload.permite_venda_sem_estoque),
    status: status || "ATIVO"
  };
};

const parseListFilters = (query) => {
  const status = sanitizeString(query.status);
  const categoria = sanitizeString(query.categoria);
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
    categoria,
    search,
    page,
    limit,
    offset: (page - 1) * limit,
    includeInactive
  };
};

const mapProdutoResponse = (produto) => ({
  id: produto.id,
  codigo: produto.codigo,
  nome: produto.nome,
  descricao: produto.descricao,
  unidade_medida: produto.unidade_medida,
  categoria: produto.categoria,
  preco_custo: produto.preco_custo,
  preco_venda: produto.preco_venda,
  peso: produto.peso_kg,
  codigo_barras: produto.codigo_barras,
  referencia_interna: produto.referencia_interna,
  fornecedor_padrao_id: produto.fornecedor_padrao_id,
  fornecedor_padrao: produto.fornecedor_padrao_id
    ? {
        id: produto.fornecedor_padrao_id,
        razao_social: produto.fornecedor_padrao_razao_social || null
      }
    : null,
  estoque_minimo: produto.estoque_minimo,
  ponto_reposicao: produto.ponto_reposicao,
  permite_venda_sem_estoque: produto.permite_venda_sem_estoque,
  status: produto.status,
  created_at: produto.created_at,
  updated_at: produto.updated_at
});

module.exports = {
  VALID_STATUS,
  validateUuid,
  parseProdutoPayload,
  parseListFilters,
  mapProdutoResponse
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
const produtoRoutes = require("./produtoRoutes");

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
router.use("/produtos", produtoRoutes);

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
  ('10000000-0000-0000-0000-000000000028', '22222222-2222-2222-2222-222222222222', 'produtos.stock', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'vendas', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000013', '22222222-2222-2222-2222-222222222222', 'estoque', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000014', '33333333-3333-3333-3333-333333333333', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000015', '33333333-3333-3333-3333-333333333333', 'financeiro', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000026', '33333333-3333-3333-3333-333333333333', 'clientes.financial', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000016', '44444444-4444-4444-4444-444444444444', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000029', '44444444-4444-4444-4444-444444444444', 'produtos.stock', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000017', '44444444-4444-4444-4444-444444444444', 'estoque', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000018', '55555555-5555-5555-5555-555555555555', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000019', '55555555-5555-5555-5555-555555555555', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000030', '55555555-5555-5555-5555-555555555555', 'produtos.stock', FALSE, TRUE, FALSE, FALSE),
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

- codigo duplicado retorna `409`
- codigo de barras duplicado retorna `409`
- fornecedor padrao inexistente retorna `404`
- produto inexistente retorna `404`
- payload invalido retorna `400`
- inativacao repetida retorna `409`
- acesso sem token retorna `401`
- acesso sem permissao retorna `403`

---

## 12. Integracao com o Backend

A integracao principal ja foi feita em `backend/src/routes/index.js` com:

`router.use("/produtos", produtoRoutes);`

Para integrar no restante do ERP:

- mantenha as rotas sob o prefixo global `/api` definido no `app.js`;
- use `GET /produtos/:id/saldo-estoque` em telas de estoque e apoio a venda;
- use `GET /produtos/alertas/estoque-minimo` em dashboard, reposicao e relatorios;
- reaproveite `fornecedor_padrao_id` nas futuras regras de compras e abastecimento.
