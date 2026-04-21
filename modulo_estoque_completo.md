# Módulo de Estoque Completo

## Solução

O backend agora expõe o fluxo completo de estoque no padrão MSC:

- `locais_estoque`: CRUD operacional básico
- `estoques`: saldo por produto e local
- `movimentacoes_estoque`: entrada, saída e transferência
- validações centralizadas em `utils/estoqueValidation.js`
- regras de negócio concentradas em `services/estoqueService.js`
- transações em saída e transferência
- integração compatível com o frontend existente

## Estrutura

```text
backend/src/
  controllers/
    estoqueController.js
  models/
    estoqueModel.js
    movimentacaoEstoqueModel.js
    localEstoqueModel.js
  routes/
    estoqueRoutes.js
  services/
    estoqueService.js
  utils/
    estoqueValidation.js
```

## Rotas implementadas

### Locais

- `GET /api/estoque/locais`
- `POST /api/estoque/locais`
- `PUT /api/estoque/locais/:id`
- `PATCH /api/estoque/locais/:id/inativar`

### Movimentações

- `POST /api/estoque/movimentacoes/entrada`
- `POST /api/estoque/movimentacoes/saida`
- `POST /api/estoque/movimentacoes/transferencia`

### Consultas

- `GET /api/estoque/saldos`
- `GET /api/estoque/saldos/produto/:produtoId`
- `GET /api/estoque/saldos/produto/:produtoId/local/:localId`
- `GET /api/estoque/movimentacoes`
- `GET /api/estoque/alertas/baixo-estoque`

## Regras implementadas

- produto precisa existir e estar ativo
- local precisa existir e estar ativo
- quantidade deve ser maior que zero
- motivo é obrigatório
- não permite saldo negativo
- não permite transferência para o mesmo local
- movimentações registram `usuario_id`
- saída e transferência usam transação

## Arquivos principais

### `backend/src/models/localEstoqueModel.js`

Arquivo implementado no projeto:

- criação de local
- atualização
- inativação
- busca por ID
- busca por código
- listagem paginada

### `backend/src/models/movimentacaoEstoqueModel.js`

Arquivo implementado no projeto:

- persistência de movimentações em `movimentacoes_estoque`

### `backend/src/models/estoqueModel.js`

Arquivo atualizado no projeto:

- listagem de saldos com `local_id`
- contagem paginada
- busca de saldo por produto/local com lock transacional
- criação e atualização de saldo
- consulta por produto
- consulta por produto e local
- listagem de movimentações com filtros
- alertas de baixo estoque

### `backend/src/services/estoqueService.js`

Arquivo atualizado no projeto:

- CRUD operacional de locais
- entrada
- saída com transação
- transferência com transação
- consultas de saldo
- consultas de movimentação
- alertas

### `backend/src/controllers/estoqueController.js`

Arquivo atualizado no projeto:

- handlers enxutos
- sem regra de negócio

### `backend/src/routes/estoqueRoutes.js`

Arquivo atualizado no projeto:

- rotas protegidas por `authMiddleware`
- permissões por `permissionMiddleware`

## Payloads

### Entrada

```json
{
  "produto_id": "10000000-0000-0000-0000-000000000001",
  "quantidade": 100,
  "local_destino_id": "20000000-0000-0000-0000-000000000001",
  "motivo": "ENTRADA_INICIAL",
  "observacoes": "Carga inicial"
}
```

### Saída

```json
{
  "produto_id": "10000000-0000-0000-0000-000000000001",
  "quantidade": 5,
  "local_origem_id": "20000000-0000-0000-0000-000000000001",
  "motivo": "AJUSTE",
  "observacoes": "Saida manual"
}
```

### Transferência

```json
{
  "produto_id": "10000000-0000-0000-0000-000000000001",
  "quantidade": 10,
  "local_origem_id": "20000000-0000-0000-0000-000000000001",
  "local_destino_id": "20000000-0000-0000-0000-000000000002",
  "motivo": "TRANSFERENCIA",
  "observacoes": "Reposicao de filial"
}
```

## Exemplos de requisição

### Listar locais

```bash
curl "http://localhost:3001/api/estoque/locais" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Entrada

```bash
curl -X POST "http://localhost:3001/api/estoque/movimentacoes/entrada" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"produto_id":"10000000-0000-0000-0000-000000000001","quantidade":100,"local_destino_id":"20000000-0000-0000-0000-000000000001","motivo":"ENTRADA_INICIAL"}'
```

### Saída

```bash
curl -X POST "http://localhost:3001/api/estoque/movimentacoes/saida" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"produto_id":"10000000-0000-0000-0000-000000000001","quantidade":5,"local_origem_id":"20000000-0000-0000-0000-000000000001","motivo":"AJUSTE"}'
```

### Transferência

```bash
curl -X POST "http://localhost:3001/api/estoque/movimentacoes/transferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"produto_id":"10000000-0000-0000-0000-000000000001","quantidade":10,"local_origem_id":"20000000-0000-0000-0000-000000000001","local_destino_id":"20000000-0000-0000-0000-000000000002","motivo":"TRANSFERENCIA"}'
```

## Integração com frontend

O frontend já tentava consumir estas rotas:

- `GET /estoque/locais`
- `POST /estoque/movimentacoes/entrada`
- `POST /estoque/movimentacoes/saida`
- `POST /estoque/movimentacoes/transferencia`

Com a implementação atual, a integração fica compatível com `frontend/src/services/estoqueService.js`.

## Observações finais

- `GET /api/estoque/saldos` agora retorna `local_id`
- `GET /api/estoque/locais` permite popular selects do frontend
- a movimentação cria ou atualiza saldo automaticamente
- saldo não é atributo do produto; continua sendo resultado das movimentações por local

Arquivo final: `modulo_estoque_completo.md`
