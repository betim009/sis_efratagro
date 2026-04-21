# Documentação de Rotas da API

## URL Base

- Backend local padrão: `http://localhost:3001/api`
- No frontend, a base configurada é `"/api"`

## Headers padrão

```http
Content-Type: application/json
Authorization: Bearer SEU_TOKEN
```

## Autenticação

- Faça login em `POST /auth/login`
- Use o token retornado no header:

```http
Authorization: Bearer SEU_TOKEN
```

## Observações rápidas

- Todas as rotas fora de `Auth` exigem token
- Quando a permissão tiver mais de um item, a rota exige todas as permissões listadas
- IDs seguem padrão UUID
- Query params são opcionais, salvo quando indicado como obrigatório

## Módulo: Autenticação

### POST /auth/login
- Finalidade: autenticar usuário
- Autenticação: Não
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api/auth/login`
  - Headers: `Content-Type: application/json`
  - Body:
```json
{
  "email": "admin@teste.com",
  "password": "123456"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teste.com","password":"123456"}'
```

### POST /auth/password-reset/request
- Finalidade: solicitar redefinição de senha
- Autenticação: Não
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api/auth/password-reset/request`
  - Headers: `Content-Type: application/json`
  - Body:
```json
{
  "email": "admin@teste.com"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teste.com"}'
```

### POST /auth/password-reset/confirm
- Finalidade: confirmar nova senha com token de reset
- Autenticação: Não
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api/auth/password-reset/confirm`
  - Headers: `Content-Type: application/json`
  - Body:
```json
{
  "token": "TOKEN_RESET",
  "newPassword": "NovaSenha123"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_RESET","newPassword":"NovaSenha123"}'
```

### POST /auth/logout
- Finalidade: encerrar sessão atual
- Autenticação: Sim
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api/auth/logout`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Body: não usa
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auth/me
- Finalidade: retornar dados do usuário autenticado
- Autenticação: Sim
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api/auth/me`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auth/permissions-example
- Finalidade: validar exemplo de rota protegida por permissão
- Autenticação: Sim
- Permissão: `clientes.read`, `estoque.read`
- Como acessar:
  - URL: `http://localhost:3001/api/auth/permissions-example`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/auth/permissions-example \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Fornecedores

### POST /fornecedores
- Finalidade: cadastrar fornecedor
- Autenticação: Sim
- Permissão: `fornecedores.create`
- Como acessar:
  - URL: `http://localhost:3001/api/fornecedores`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "razao_social": "Fornecedor Exemplo LTDA",
  "cnpj_cpf": "12345678000199",
  "tipo_pessoa": "PJ",
  "email": "fornecedor@teste.com"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/fornecedores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"razao_social":"Fornecedor Exemplo LTDA","cnpj_cpf":"12345678000199","tipo_pessoa":"PJ","email":"fornecedor@teste.com"}'
```

### GET /fornecedores
- Finalidade: listar fornecedores
- Autenticação: Sim
- Permissão: `fornecedores.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fornecedores`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `status`, `search`
- Exemplo:
```bash
curl "http://localhost:3001/api/fornecedores?page=1&limit=10&search=agro" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fornecedores/:id
- Finalidade: buscar fornecedor por ID
- Autenticação: Sim
- Permissão: `fornecedores.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fornecedores/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/fornecedores/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT /fornecedores/:id
- Finalidade: atualizar fornecedor
- Autenticação: Sim
- Permissão: `fornecedores.update`
- Como acessar:
  - URL: `http://localhost:3001/api/fornecedores/{id}`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "razao_social": "Fornecedor Atualizado LTDA",
  "cnpj_cpf": "12345678000199",
  "tipo_pessoa": "PJ",
  "email": "novo@teste.com",
  "status": "ATIVO"
}
```
- Exemplo:
```bash
curl -X PUT http://localhost:3001/api/fornecedores/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"razao_social":"Fornecedor Atualizado LTDA","cnpj_cpf":"12345678000199","tipo_pessoa":"PJ","email":"novo@teste.com","status":"ATIVO"}'
```

### PATCH /fornecedores/:id/inativar
- Finalidade: inativar fornecedor
- Autenticação: Sim
- Permissão: `fornecedores.inactivate`
- Como acessar:
  - URL: `http://localhost:3001/api/fornecedores/{id}/inativar`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/fornecedores/UUID/inativar \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fornecedores/:id/historico-compras
- Finalidade: listar histórico de compras do fornecedor
- Autenticação: Sim
- Permissão: `fornecedores.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fornecedores/{id}/historico-compras`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/fornecedores/UUID/historico-compras \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Clientes

### POST /clientes
- Finalidade: cadastrar cliente
- Autenticação: Sim
- Permissão: `clientes.create`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "nome_razao_social": "Cliente Exemplo",
  "cpf_cnpj": "12345678909",
  "tipo_cliente": "PF",
  "email": "cliente@teste.com"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"nome_razao_social":"Cliente Exemplo","cpf_cnpj":"12345678909","tipo_cliente":"PF","email":"cliente@teste.com"}'
```

### GET /clientes
- Finalidade: listar clientes
- Autenticação: Sim
- Permissão: `clientes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `status`, `search`, `include_inativos`
- Exemplo:
```bash
curl "http://localhost:3001/api/clientes?page=1&limit=10&status=ATIVO" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /clientes/:id
- Finalidade: buscar cliente por ID
- Autenticação: Sim
- Permissão: `clientes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/clientes/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT /clientes/:id
- Finalidade: atualizar cliente
- Autenticação: Sim
- Permissão: `clientes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes/{id}`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "nome_razao_social": "Cliente Atualizado",
  "cpf_cnpj": "12345678909",
  "tipo_cliente": "PF",
  "email": "cliente@novo.com"
}
```
- Exemplo:
```bash
curl -X PUT http://localhost:3001/api/clientes/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"nome_razao_social":"Cliente Atualizado","cpf_cnpj":"12345678909","tipo_cliente":"PF","email":"cliente@novo.com"}'
```

### PATCH /clientes/:id/status
- Finalidade: alterar status do cliente
- Autenticação: Sim
- Permissão: não declarada na rota
- Como acessar:
  - URL: `http://localhost:3001/api/clientes/{id}/status`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "status": "BLOQUEADO"
}
```
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/clientes/UUID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"status":"BLOQUEADO"}'
```

### PATCH /clientes/:id/inativar
- Finalidade: inativar cliente
- Autenticação: Sim
- Permissão: `clientes.inactivate`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes/{id}/inativar`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/clientes/UUID/inativar \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /clientes/:id/historico-compras
- Finalidade: listar histórico de compras do cliente
- Autenticação: Sim
- Permissão: `clientes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes/{id}/historico-compras`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/clientes/UUID/historico-compras \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /clientes/:id/debitos-em-aberto
- Finalidade: listar débitos em aberto do cliente
- Autenticação: Sim
- Permissão: `clientes.read` e regra interna `clientes.financial.read`
- Como acessar:
  - URL: `http://localhost:3001/api/clientes/{id}/debitos-em-aberto`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/clientes/UUID/debitos-em-aberto \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Produtos

### GET /produtos/alertas/estoque-minimo
- Finalidade: listar produtos abaixo do estoque mínimo
- Autenticação: Sim
- Permissão: `produtos.read`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/alertas/estoque-minimo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/produtos/alertas/estoque-minimo \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /produtos/status/:status
- Finalidade: listar produtos por status
- Autenticação: Sim
- Permissão: `produtos.read`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/status/{status}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `status` = `ATIVO` ou `INATIVO`
- Exemplo:
```bash
curl http://localhost:3001/api/produtos/status/ATIVO \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /produtos/categoria/:categoria
- Finalidade: listar produtos por categoria
- Autenticação: Sim
- Permissão: `produtos.read`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/categoria/{categoria}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `categoria`
- Exemplo:
```bash
curl http://localhost:3001/api/produtos/categoria/SEMENTES \
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST /produtos
- Finalidade: cadastrar produto
- Autenticação: Sim
- Permissão: `produtos.create`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "codigo": "PRD-001",
  "nome": "Fertilizante X",
  "categoria": "INSUMOS",
  "preco_venda": 120.5
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"codigo":"PRD-001","nome":"Fertilizante X","categoria":"INSUMOS","preco_venda":120.5}'
```

### GET /produtos
- Finalidade: listar produtos
- Autenticação: Sim
- Permissão: `produtos.read`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `status`, `categoria`, `search`, `include_inativos`
- Exemplo:
```bash
curl "http://localhost:3001/api/produtos?page=1&limit=10&categoria=INSUMOS" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /produtos/:id/saldo-estoque
- Finalidade: consultar saldo de estoque do produto
- Autenticação: Sim
- Permissão: `produtos.read`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/{id}/saldo-estoque`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/produtos/UUID/saldo-estoque \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /produtos/:id
- Finalidade: buscar produto por ID
- Autenticação: Sim
- Permissão: `produtos.read`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/produtos/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT /produtos/:id
- Finalidade: atualizar produto
- Autenticação: Sim
- Permissão: `produtos.update`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/{id}`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "codigo": "PRD-001",
  "nome": "Fertilizante X Premium",
  "categoria": "INSUMOS",
  "preco_venda": 150
}
```
- Exemplo:
```bash
curl -X PUT http://localhost:3001/api/produtos/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"codigo":"PRD-001","nome":"Fertilizante X Premium","categoria":"INSUMOS","preco_venda":150}'
```

### PATCH /produtos/:id/inativar
- Finalidade: inativar produto
- Autenticação: Sim
- Permissão: `produtos.inactivate`
- Como acessar:
  - URL: `http://localhost:3001/api/produtos/{id}/inativar`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/produtos/UUID/inativar \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Estoque

### GET /estoque/saldos
- Finalidade: listar saldos de estoque
- Autenticação: Sim
- Permissão: `estoque.read`
- Como acessar:
  - URL: `http://localhost:3001/api/estoque/saldos`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: consulte filtros usados pelo serviço chamador; a rota recebe `request.query`
- Exemplo:
```bash
curl "http://localhost:3001/api/estoque/saldos?page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /estoque/movimentacoes
- Finalidade: listar movimentações de estoque
- Autenticação: Sim
- Permissão: `estoque.read`
- Como acessar:
  - URL: `http://localhost:3001/api/estoque/movimentacoes`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: consulte filtros usados pelo serviço chamador; a rota recebe `request.query`
- Exemplo:
```bash
curl "http://localhost:3001/api/estoque/movimentacoes?page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /estoque/alertas/baixo-estoque
- Finalidade: listar alertas de baixo estoque
- Autenticação: Sim
- Permissão: `estoque.read`
- Como acessar:
  - URL: `http://localhost:3001/api/estoque/alertas/baixo-estoque`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/estoque/alertas/baixo-estoque \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Vendas

### GET /vendas
- Finalidade: listar vendas
- Autenticação: Sim
- Permissão: `vendas.read`
- Como acessar:
  - URL: `http://localhost:3001/api/vendas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: a rota recebe `request.query`
- Exemplo:
```bash
curl "http://localhost:3001/api/vendas?page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Financeiro

### GET /financeiro/duplicatas/alertas/vencidas
- Finalidade: listar duplicatas vencidas
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/alertas/vencidas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/financeiro/duplicatas/alertas/vencidas \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /financeiro/duplicatas/alertas/vencendo
- Finalidade: listar duplicatas a vencer
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/alertas/vencendo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dias`
- Exemplo:
```bash
curl "http://localhost:3001/api/financeiro/duplicatas/alertas/vencendo?dias=7" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /financeiro/resumo
- Finalidade: retornar resumo financeiro
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/resumo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/financeiro/resumo \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /financeiro/duplicatas/status/:status
- Finalidade: listar duplicatas por status
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/status/{status}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `status` = `EM_ABERTO`, `PAGO_PARCIALMENTE`, `PAGO`, `VENCIDO`, `CANCELADO`
- Exemplo:
```bash
curl http://localhost:3001/api/financeiro/duplicatas/status/EM_ABERTO \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /financeiro/duplicatas/cliente/:clienteId
- Finalidade: listar duplicatas por cliente
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/cliente/{clienteId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `clienteId`
- Exemplo:
```bash
curl http://localhost:3001/api/financeiro/duplicatas/cliente/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST /financeiro/duplicatas/gerar
- Finalidade: gerar uma duplicata
- Autenticação: Sim
- Permissão: `financeiro.create`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/gerar`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "venda_id": "UUID",
  "cliente_id": "UUID",
  "numero": "DUP-0001",
  "valor_total": 1500,
  "vencimento": "2026-05-10"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/financeiro/duplicatas/gerar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"venda_id":"UUID","cliente_id":"UUID","numero":"DUP-0001","valor_total":1500,"vencimento":"2026-05-10"}'
```

### POST /financeiro/duplicatas/gerar-parcelas
- Finalidade: gerar duplicatas parceladas
- Autenticação: Sim
- Permissão: `financeiro.create`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/gerar-parcelas`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "venda_id": "UUID",
  "cliente_id": "UUID",
  "valor_total": 3000,
  "total_parcelas": 3,
  "primeiro_vencimento": "2026-05-10",
  "prefixo_numero": "DUP-2026"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/financeiro/duplicatas/gerar-parcelas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"venda_id":"UUID","cliente_id":"UUID","valor_total":3000,"total_parcelas":3,"primeiro_vencimento":"2026-05-10","prefixo_numero":"DUP-2026"}'
```

### GET /financeiro/duplicatas
- Finalidade: listar duplicatas
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `status`, `cliente_id`, `search`, `data_inicio`, `data_fim`
- Exemplo:
```bash
curl "http://localhost:3001/api/financeiro/duplicatas?status=EM_ABERTO&page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /financeiro/duplicatas/:id
- Finalidade: buscar duplicata por ID
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/financeiro/duplicatas/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /financeiro/duplicatas/:id/pagamentos
- Finalidade: listar pagamentos de uma duplicata
- Autenticação: Sim
- Permissão: `financeiro.read`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/{id}/pagamentos`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/financeiro/duplicatas/UUID/pagamentos \
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST /financeiro/duplicatas/:id/pagamentos
- Finalidade: registrar pagamento
- Autenticação: Sim
- Permissão: `financeiro.create`
- Como acessar:
  - URL: `http://localhost:3001/api/financeiro/duplicatas/{id}/pagamentos`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "forma_pagamento": "PIX",
  "valor": 500,
  "data_pagamento": "2026-04-21T10:00:00Z"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/financeiro/duplicatas/UUID/pagamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"forma_pagamento":"PIX","valor":500,"data_pagamento":"2026-04-21T10:00:00Z"}'
```

## Módulo: Frota

### GET /frota/alertas/manutencao-preventiva
- Finalidade: listar alertas de manutenção preventiva
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/alertas/manutencao-preventiva`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dias`
- Exemplo:
```bash
curl "http://localhost:3001/api/frota/alertas/manutencao-preventiva?dias=15" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /frota/relatorios/custos-manutencao
- Finalidade: relatório de custos de manutenção
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/relatorios/custos-manutencao`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `veiculo_id`, `tipo_manutencao`, `status`, `data_inicio`, `data_fim`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/frota/relatorios/custos-manutencao?status=CONCLUIDA" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /frota/resumo
- Finalidade: resumo da frota
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/resumo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/frota/resumo \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /frota/veiculos/status/:status
- Finalidade: listar veículos por status
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos/status/{status}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `status` = `ATIVO`, `MANUTENCAO`, `INATIVO`
- Exemplo:
```bash
curl http://localhost:3001/api/frota/veiculos/status/ATIVO \
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST /frota/veiculos
- Finalidade: cadastrar veículo
- Autenticação: Sim
- Permissão: `frota.create`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "placa": "ABC1D23",
  "modelo": "FH 540",
  "marca": "Volvo",
  "tipo_veiculo": "CAMINHAO"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/frota/veiculos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"placa":"ABC1D23","modelo":"FH 540","marca":"Volvo","tipo_veiculo":"CAMINHAO"}'
```

### GET /frota/veiculos
- Finalidade: listar veículos
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `status`, `tipo_veiculo`, `search`
- Exemplo:
```bash
curl "http://localhost:3001/api/frota/veiculos?status=ATIVO&page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /frota/veiculos/:id
- Finalidade: buscar veículo por ID
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/frota/veiculos/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT /frota/veiculos/:id
- Finalidade: atualizar veículo
- Autenticação: Sim
- Permissão: `frota.update`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos/{id}`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "placa": "ABC1D23",
  "modelo": "FH 540",
  "marca": "Volvo",
  "tipo_veiculo": "CAMINHAO",
  "status": "ATIVO"
}
```
- Exemplo:
```bash
curl -X PUT http://localhost:3001/api/frota/veiculos/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"placa":"ABC1D23","modelo":"FH 540","marca":"Volvo","tipo_veiculo":"CAMINHAO","status":"ATIVO"}'
```

### PATCH /frota/veiculos/:id/status
- Finalidade: alterar status do veículo
- Autenticação: Sim
- Permissão: `frota.update`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos/{id}/status`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "status": "MANUTENCAO"
}
```
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/frota/veiculos/UUID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"status":"MANUTENCAO"}'
```

### GET /frota/veiculos/:id/historico
- Finalidade: consultar histórico do veículo
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos/{id}/historico`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/frota/veiculos/UUID/historico \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /frota/veiculos/:id/manutencoes
- Finalidade: listar manutenções do veículo
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/veiculos/{id}/manutencoes`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/frota/veiculos/UUID/manutencoes \
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST /frota/manutencoes
- Finalidade: registrar manutenção
- Autenticação: Sim
- Permissão: `frota.create`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/manutencoes`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "veiculo_id": "UUID",
  "tipo_manutencao": "PREVENTIVA",
  "descricao": "Troca de óleo",
  "data_manutencao": "2026-04-21"
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/frota/manutencoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"veiculo_id":"UUID","tipo_manutencao":"PREVENTIVA","descricao":"Troca de óleo","data_manutencao":"2026-04-21"}'
```

### GET /frota/manutencoes
- Finalidade: listar manutenções
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/manutencoes`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `veiculo_id`, `tipo_manutencao`, `status`, `data_inicio`, `data_fim`
- Exemplo:
```bash
curl "http://localhost:3001/api/frota/manutencoes?tipo_manutencao=PREVENTIVA" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /frota/manutencoes/:id
- Finalidade: buscar manutenção por ID
- Autenticação: Sim
- Permissão: `frota.read`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/manutencoes/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/frota/manutencoes/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT /frota/manutencoes/:id
- Finalidade: atualizar manutenção
- Autenticação: Sim
- Permissão: `frota.update`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/manutencoes/{id}`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "tipo_manutencao": "CORRETIVA",
  "descricao": "Troca de pneu",
  "data_manutencao": "2026-04-21",
  "status": "EM_EXECUCAO"
}
```
- Exemplo:
```bash
curl -X PUT http://localhost:3001/api/frota/manutencoes/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"tipo_manutencao":"CORRETIVA","descricao":"Troca de pneu","data_manutencao":"2026-04-21","status":"EM_EXECUCAO"}'
```

### PATCH /frota/manutencoes/:id/status
- Finalidade: alterar status da manutenção
- Autenticação: Sim
- Permissão: `frota.update`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/manutencoes/{id}/status`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "status": "CONCLUIDA"
}
```
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/frota/manutencoes/UUID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"status":"CONCLUIDA"}'
```

### PATCH /frota/entregas/:entregaId/vincular-veiculo/:veiculoId
- Finalidade: vincular veículo a uma entrega
- Autenticação: Sim
- Permissão: `frota.update`
- Como acessar:
  - URL: `http://localhost:3001/api/frota/entregas/{entregaId}/vincular-veiculo/{veiculoId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `entregaId`, `veiculoId`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/frota/entregas/UUID/vincular-veiculo/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Entregas

- Não há arquivo de rotas dedicado para `entregas` no backend atual
- Existem referências a entregas apenas em:
  - `PATCH /frota/entregas/:entregaId/vincular-veiculo/:veiculoId`
  - `PATCH /fretes/:id/vincular-entrega/:entregaId`
  - relatórios em `/relatorios/entregas`

## Módulo: Fretes

### POST /fretes/tabelas
- Finalidade: criar tabela de frete
- Autenticação: Sim
- Permissão: `fretes.tables.create`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/tabelas`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "nome": "Tabela Sudeste",
  "tipo_calculo": "POR_REGIAO",
  "regiao": "SUDESTE",
  "valor_base": 150
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/fretes/tabelas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"nome":"Tabela Sudeste","tipo_calculo":"POR_REGIAO","regiao":"SUDESTE","valor_base":150}'
```

### GET /fretes/tabelas
- Finalidade: listar tabelas de frete
- Autenticação: Sim
- Permissão: `fretes.tables.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/tabelas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `page`, `limit`, `status`, `tipo_calculo`, `regiao`, `search`
- Exemplo:
```bash
curl "http://localhost:3001/api/fretes/tabelas?tipo_calculo=POR_REGIAO" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fretes/tabelas/:id
- Finalidade: buscar tabela de frete por ID
- Autenticação: Sim
- Permissão: `fretes.tables.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/tabelas/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/fretes/tabelas/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT /fretes/tabelas/:id
- Finalidade: atualizar tabela de frete
- Autenticação: Sim
- Permissão: `fretes.tables.update`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/tabelas/{id}`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "nome": "Tabela Sudeste Atualizada",
  "tipo_calculo": "POR_REGIAO",
  "regiao": "SUDESTE",
  "valor_base": 180
}
```
- Exemplo:
```bash
curl -X PUT http://localhost:3001/api/fretes/tabelas/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"nome":"Tabela Sudeste Atualizada","tipo_calculo":"POR_REGIAO","regiao":"SUDESTE","valor_base":180}'
```

### PATCH /fretes/tabelas/:id/inativar
- Finalidade: inativar tabela de frete
- Autenticação: Sim
- Permissão: `fretes.tables.update`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/tabelas/{id}/inativar`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/fretes/tabelas/UUID/inativar \
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST /fretes/calcular
- Finalidade: calcular e registrar frete
- Autenticação: Sim
- Permissão: `fretes.calculate`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/calcular`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Body:
```json
{
  "venda_id": "UUID",
  "modalidade": "PROPRIO",
  "regiao_destino": "SUDESTE",
  "peso_total_kg": 1200,
  "distancia_km": 350
}
```
- Exemplo:
```bash
curl -X POST http://localhost:3001/api/fretes/calcular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"venda_id":"UUID","modalidade":"PROPRIO","regiao_destino":"SUDESTE","peso_total_kg":1200,"distancia_km":350}'
```

### GET /fretes/periodo
- Finalidade: listar fretes por período
- Autenticação: Sim
- Permissão: `fretes.reports.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/periodo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params obrigatórios: `dataInicio`, `dataFim`
  - Query params opcionais: `status`, `modalidade`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/fretes/periodo?dataInicio=2026-04-01&dataFim=2026-04-30" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fretes/regiao/:regiao
- Finalidade: listar fretes por região
- Autenticação: Sim
- Permissão: `fretes.reports.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/regiao/{regiao}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `regiao`
  - Query params: `status`, `modalidade`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/fretes/regiao/SUDESTE?page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fretes/venda/:vendaId
- Finalidade: buscar frete por venda
- Autenticação: Sim
- Permissão: `fretes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/venda/{vendaId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `vendaId`
- Exemplo:
```bash
curl http://localhost:3001/api/fretes/venda/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fretes
- Finalidade: listar fretes
- Autenticação: Sim
- Permissão: `fretes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `status`, `modalidade`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/fretes?status=CALCULADO&page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /fretes/:id
- Finalidade: buscar frete por ID
- Autenticação: Sim
- Permissão: `fretes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/fretes/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PATCH /fretes/:id/vincular-entrega/:entregaId
- Finalidade: vincular entrega ao frete
- Autenticação: Sim
- Permissão: `fretes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/{id}/vincular-entrega/{entregaId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`, `entregaId`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/fretes/UUID/vincular-entrega/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PATCH /fretes/:id/vincular-veiculo/:veiculoId
- Finalidade: vincular veículo ao frete
- Autenticação: Sim
- Permissão: `fretes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/{id}/vincular-veiculo/{veiculoId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`, `veiculoId`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/fretes/UUID/vincular-veiculo/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PATCH /fretes/:id/registrar-custo-real
- Finalidade: registrar custo real do frete
- Autenticação: Sim
- Permissão: `fretes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/fretes/{id}/registrar-custo-real`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
  - Body:
```json
{
  "custo_real": 980.75,
  "observacoes": "Valor ajustado após fechamento"
}
```
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/fretes/UUID/registrar-custo-real \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"custo_real":980.75,"observacoes":"Valor ajustado após fechamento"}'
```

## Módulo: Dashboard

### GET /dashboard/resumo
- Finalidade: resumo geral do dashboard
- Autenticação: Sim
- Permissão: `dashboard.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/resumo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/dashboard/resumo \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/vendas
- Finalidade: indicadores de vendas
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.sales.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/vendas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `localId`, `unidadeId`
- Exemplo:
```bash
curl "http://localhost:3001/api/dashboard/vendas?dataInicio=2026-04-01&dataFim=2026-04-30" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/financeiro
- Finalidade: indicadores financeiros
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.finance.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/financeiro`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `dias`, `localId`, `unidadeId`
- Exemplo:
```bash
curl "http://localhost:3001/api/dashboard/financeiro?dias=7" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/estoque
- Finalidade: indicadores de estoque
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.stock.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/estoque`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `localId`, `unidadeId`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/dashboard/estoque?limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/vendas-futuras
- Finalidade: indicadores de vendas futuras
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.sales.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/vendas-futuras`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `localId`, `unidadeId`
- Exemplo:
```bash
curl http://localhost:3001/api/dashboard/vendas-futuras \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/frota
- Finalidade: indicadores da frota
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.fleet.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/frota`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `localId`, `unidadeId`
- Exemplo:
```bash
curl http://localhost:3001/api/dashboard/frota \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/series/vendas
- Finalidade: série temporal de vendas
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.sales.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/series/vendas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `granularidade`, `localId`, `unidadeId`
- Exemplo:
```bash
curl "http://localhost:3001/api/dashboard/series/vendas?granularidade=DIA" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/alertas
- Finalidade: alertas do dashboard
- Autenticação: Sim
- Permissão: `dashboard.read`, `dashboard.alerts.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/alertas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dias`
- Exemplo:
```bash
curl "http://localhost:3001/api/dashboard/alertas?dias=7" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /dashboard/completo
- Finalidade: carregar dashboard completo
- Autenticação: Sim
- Permissão: `dashboard.read`
- Como acessar:
  - URL: `http://localhost:3001/api/dashboard/completo`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: aceita filtros do dashboard via `request.query`
- Exemplo:
```bash
curl http://localhost:3001/api/dashboard/completo \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Relatórios

### GET /relatorios/vendas
- Finalidade: relatório de vendas
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.sales.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/vendas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `clienteId`, `vendedorId`, `status`, `tipoVenda`, `agrupamento`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/relatorios/vendas?dataInicio=2026-04-01&dataFim=2026-04-30" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/vendas/exportar/pdf
- Finalidade: exportar relatório de vendas em PDF
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.sales.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/vendas/exportar/pdf`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: mesmos filtros de `/relatorios/vendas`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/vendas/exportar/pdf \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-vendas.pdf
```

### GET /relatorios/vendas/exportar/excel
- Finalidade: exportar relatório de vendas em Excel
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.sales.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/vendas/exportar/excel`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: mesmos filtros de `/relatorios/vendas`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/vendas/exportar/excel \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-vendas.xlsx
```

### GET /relatorios/estoque
- Finalidade: relatório de estoque
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.stock.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/estoque`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `localId`, `produtoId`, `apenasAbaixoMinimo`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/relatorios/estoque?apenasAbaixoMinimo=true" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/estoque/exportar/pdf
- Finalidade: exportar relatório de estoque em PDF
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.stock.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/estoque/exportar/pdf`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/estoque/exportar/pdf \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-estoque.pdf
```

### GET /relatorios/estoque/exportar/excel
- Finalidade: exportar relatório de estoque em Excel
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.stock.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/estoque/exportar/excel`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/estoque/exportar/excel \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-estoque.xlsx
```

### GET /relatorios/movimentacoes-estoque
- Finalidade: relatório de movimentações de estoque
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.stock.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/movimentacoes-estoque`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `produtoId`, `localId`, `vendedorId`, `tipoMovimentacao`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/relatorios/movimentacoes-estoque?tipoMovimentacao=ENTRADA" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/duplicatas
- Finalidade: relatório de duplicatas
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.finance.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/duplicatas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `clienteId`, `status`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/relatorios/duplicatas?status=EM_ABERTO" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/duplicatas/exportar/pdf
- Finalidade: exportar relatório de duplicatas em PDF
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.finance.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/duplicatas/exportar/pdf`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/duplicatas/exportar/pdf \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-duplicatas.pdf
```

### GET /relatorios/duplicatas/exportar/excel
- Finalidade: exportar relatório de duplicatas em Excel
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.finance.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/duplicatas/exportar/excel`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/duplicatas/exportar/excel \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-duplicatas.xlsx
```

### GET /relatorios/pagamentos
- Finalidade: relatório de pagamentos
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.finance.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/pagamentos`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `formaPagamento`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/relatorios/pagamentos?formaPagamento=PIX" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/entregas
- Finalidade: relatório de entregas
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.delivery.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/entregas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `status`, `veiculoId`, `vendedorId`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/relatorios/entregas?status=EM_TRANSITO" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/entregas/exportar/pdf
- Finalidade: exportar relatório de entregas em PDF
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.delivery.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/entregas/exportar/pdf`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/entregas/exportar/pdf \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-entregas.pdf
```

### GET /relatorios/entregas/exportar/excel
- Finalidade: exportar relatório de entregas em Excel
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.delivery.read`, `relatorios.export`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/entregas/exportar/excel`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/entregas/exportar/excel \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio-entregas.xlsx
```

### GET /relatorios/frota
- Finalidade: relatório de frota
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.fleet.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/frota`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `veiculoId`, `status`, `tipoManutencao`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/frota \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /relatorios/vendas-futuras
- Finalidade: relatório de vendas futuras
- Autenticação: Sim
- Permissão: `relatorios.read`, `relatorios.sales.read`
- Como acessar:
  - URL: `http://localhost:3001/api/relatorios/vendas-futuras`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `dataInicio`, `dataFim`, `clienteId`, `status`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/relatorios/vendas-futuras \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Auditoria

### GET /auditoria/logs/metricas
- Finalidade: métricas de auditoria
- Autenticação: Sim
- Permissão: `auditoria.read`, `auditoria.read.all`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs/metricas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `usuarioId`, `modulo`, `acao`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/auditoria/logs/metricas \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auditoria/logs/usuario/:usuarioId
- Finalidade: logs por usuário
- Autenticação: Sim
- Permissão: `auditoria.read`, `auditoria.read.by_user`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs/usuario/{usuarioId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `usuarioId`
  - Query params: `dataInicio`, `dataFim`, `acao`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/auditoria/logs/usuario/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auditoria/logs/modulo/:modulo
- Finalidade: logs por módulo
- Autenticação: Sim
- Permissão: `auditoria.read`, `auditoria.read.by_module`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs/modulo/{modulo}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `modulo`
  - Query params: `dataInicio`, `dataFim`, `acao`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/auditoria/logs/modulo/clientes \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auditoria/logs/entidade/:entidade/:entidadeId
- Finalidade: logs por entidade e registro
- Autenticação: Sim
- Permissão: `auditoria.read`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs/entidade/{entidade}/{entidadeId}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `entidade`, `entidadeId`
  - Query params: `dataInicio`, `dataFim`, `acao`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/auditoria/logs/entidade/clientes/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auditoria/logs/acao/:acao
- Finalidade: logs por ação
- Autenticação: Sim
- Permissão: `auditoria.read`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs/acao/{acao}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `acao`
  - Query params: `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/auditoria/logs/acao/LOGIN \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auditoria/logs/:id
- Finalidade: buscar log por ID
- Autenticação: Sim
- Permissão: `auditoria.read`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/auditoria/logs/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /auditoria/logs
- Finalidade: listar logs gerais
- Autenticação: Sim
- Permissão: `auditoria.read`
- Como acessar:
  - URL: `http://localhost:3001/api/auditoria/logs`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `usuarioId`, `modulo`, `entidade`, `entidadeId`, `acao`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/auditoria/logs?modulo=clientes&page=1&limit=50" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Módulo: Notificações

### GET /notificacoes/nao-lidas/contagem
- Finalidade: contar notificações não lidas do usuário
- Autenticação: Sim
- Permissão: `notificacoes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/nao-lidas/contagem`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl http://localhost:3001/api/notificacoes/nao-lidas/contagem \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PATCH /notificacoes/marcar-todas-lidas
- Finalidade: marcar todas as notificações do usuário como lidas
- Autenticação: Sim
- Permissão: `notificacoes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/marcar-todas-lidas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/notificacoes/marcar-todas-lidas \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /notificacoes/todas
- Finalidade: listar notificações de todos os usuários
- Autenticação: Sim
- Permissão: `notificacoes.read`, `notificacoes.read.all`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/todas`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `tipo`, `status`, `prioridade`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/notificacoes/todas \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /notificacoes/tipo/:tipo
- Finalidade: listar notificações por tipo
- Autenticação: Sim
- Permissão: `notificacoes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/tipo/{tipo}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `tipo`
  - Query params: `status`, `prioridade`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/notificacoes/tipo/ESTOQUE_BAIXO \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /notificacoes/status/:status
- Finalidade: listar notificações por status
- Autenticação: Sim
- Permissão: `notificacoes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/status/{status}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `status` = `NAO_LIDA`, `LIDA`, `ARQUIVADA`
  - Query params: `tipo`, `prioridade`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl http://localhost:3001/api/notificacoes/status/NAO_LIDA \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PATCH /notificacoes/:id/marcar-lida
- Finalidade: marcar notificação como lida
- Autenticação: Sim
- Permissão: `notificacoes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/{id}/marcar-lida`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/notificacoes/UUID/marcar-lida \
  -H "Authorization: Bearer SEU_TOKEN"
```

### PATCH /notificacoes/:id/arquivar
- Finalidade: arquivar notificação
- Autenticação: Sim
- Permissão: `notificacoes.update`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/{id}/arquivar`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl -X PATCH http://localhost:3001/api/notificacoes/UUID/arquivar \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /notificacoes/:id
- Finalidade: buscar notificação por ID
- Autenticação: Sim
- Permissão: `notificacoes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes/{id}`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Params: `id`
- Exemplo:
```bash
curl http://localhost:3001/api/notificacoes/UUID \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /notificacoes
- Finalidade: listar notificações do usuário autenticado
- Autenticação: Sim
- Permissão: `notificacoes.read`
- Como acessar:
  - URL: `http://localhost:3001/api/notificacoes`
  - Headers: `Authorization: Bearer SEU_TOKEN`
  - Query params: `tipo`, `status`, `prioridade`, `dataInicio`, `dataFim`, `page`, `limit`
- Exemplo:
```bash
curl "http://localhost:3001/api/notificacoes?status=NAO_LIDA&page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Rotas de apoio fora dos módulos

### GET /
- Finalidade: validar API base
- Autenticação: Não
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api`
- Exemplo:
```bash
curl http://localhost:3001/api
```

### GET /health
- Finalidade: health check da API
- Autenticação: Não
- Permissão: Não
- Como acessar:
  - URL: `http://localhost:3001/api/health`
- Exemplo:
```bash
curl http://localhost:3001/api/health
```

---

Arquivo: `rotas_api_erp.md`
