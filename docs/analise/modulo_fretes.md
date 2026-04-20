# Módulo de Controle de Frete — Documentação Técnica

## 1. Visão Geral

O módulo de frete fornece:

- **Tabelas de frete configuráveis** — com 4 modos de cálculo (por região, peso, distância, híbrido)
- **Cálculo automático** — reutilizável e isolado em helper dedicado
- **Frete operacional** — registro 1:1 com venda, vinculação com entrega e veículo
- **Custo real vs. estimado** — registro separado para análise de margem
- **Consultas gerenciais** — por período (com métricas) e por região

**Base URL:** `/api/fretes/...`

**Autenticação:** JWT obrigatório (Bearer token).

---

## 2. Estratégia de Modelagem

### Duas entidades separadas

| Entidade | Tabela DB | Finalidade |
| -------- | --------- | ---------- |
| Tabela de Frete | `tabelas_frete` | Configuração — define como o cálculo é feito |
| Frete Operacional | `fretes` | Transacional — registro do frete de cada venda |

### Decisões de design

- **Transportadora = Fornecedor** — não criamos entidade separada. O campo `transportadora_fornecedor_id` referencia `fornecedores(id)`. Justificativa: transportadora é um tipo de fornecedor de serviço; criar entidade própria seria sobre-engenharia para o escopo atual.
- **Relação frete ↔ entrega** — feita via `entregas.frete_id` (FK na tabela entregas), não com campo na tabela fretes. Isso respeita a modelagem original.
- **Modalidade** — `PROPRIO` (frota da empresa) ou `TERCEIRO` (transportadora). Se TERCEIRO, `transportadora_fornecedor_id` é obrigatório.
- **Status do frete** — ciclo de vida: `CALCULADO → VINCULADO → EM_TRANSITO → CONCLUIDO` (ou `CANCELADO`).

### Migração aplicada

A tabela `fretes` já existia. Foi estendida com:
- `status` (CALCULADO, VINCULADO, EM_TRANSITO, CONCLUIDO, CANCELADO)
- `tabela_frete_id` (FK para tabelas_frete)
- Atualização do CHECK de `tipo_calculo` para incluir `HIBRIDO`

Nova tabela criada: `tabelas_frete`.

---

## 3. Estrutura dos Arquivos

```
src/
  utils/
    freteValidation.js    — Validações e parsers de entrada
    freteCalculator.js    — Motor de cálculo isolado e reutilizável
  models/
    tabelaFreteModel.js   — CRUD tabelas_frete
    freteModel.js         — CRUD fretes + queries gerenciais
  services/
    freteService.js       — Regras de negócio e orquestração
  controllers/
    freteController.js    — Handlers thin (14 métodos)
  routes/
    freteRoutes.js        — 14 rotas com permissões
  database/
    migrations.sql        — Tabela tabelas_frete + ALTER TABLE fretes
```

---

## 4. Estratégia de Cálculo do Frete

O cálculo é executado pelo `freteCalculator.js`, isolado e sem dependência de banco:

| Modo | Fórmula | Quando usar |
| ---- | ------- | ----------- |
| `POR_REGIAO` | `valor_fixo` (ou `valor_base` se fixo=0) | Frete tabelado por localidade |
| `POR_PESO` | `valor_base + (peso_kg × valor_por_kg)` | Carga com peso variável |
| `POR_DISTANCIA` | `valor_base + (distancia_km × valor_por_km)` | Entrega com distância variável |
| `HIBRIDO` | `valor_base + (peso_kg × valor_por_kg) + (distancia_km × valor_por_km) + valor_fixo` | Operações complexas combinando peso e distância |
| `MANUAL` | Valor informado diretamente (sem tabela) | Exceções ou negociação pontual |

**Validações no cálculo:**
- POR_PESO: peso deve estar entre `peso_minimo` e `peso_maximo` da tabela
- POR_DISTANCIA: distância deve estar entre `distancia_minima` e `distancia_maxima`
- Resultado arredondado para 2 casas (centavos)

**Resolução automática de tabela:**
1. Se `tabela_frete_id` foi informado → usa direto
2. Se não, mas `regiao_destino` foi informado → busca tabela ativa pela região
3. Se nenhuma tabela encontrada → frete fica como MANUAL (valor 0)

---

## 5. Matriz de Permissões

| Rota | Permissões |
| ---- | ---------- |
| `POST   /fretes/tabelas` | `fretes.tables.create` |
| `GET    /fretes/tabelas` | `fretes.tables.read` |
| `GET    /fretes/tabelas/:id` | `fretes.tables.read` |
| `PUT    /fretes/tabelas/:id` | `fretes.tables.update` |
| `PATCH  /fretes/tabelas/:id/inativar` | `fretes.tables.update` |
| `POST   /fretes/calcular` | `fretes.calculate` |
| `GET    /fretes` | `fretes.read` |
| `GET    /fretes/:id` | `fretes.read` |
| `GET    /fretes/venda/:vendaId` | `fretes.read` |
| `PATCH  /fretes/:id/vincular-entrega/:entregaId` | `fretes.update` |
| `PATCH  /fretes/:id/vincular-veiculo/:veiculoId` | `fretes.update` |
| `PATCH  /fretes/:id/registrar-custo-real` | `fretes.update` |
| `GET    /fretes/periodo` | `fretes.reports.read` |
| `GET    /fretes/regiao/:regiao` | `fretes.reports.read` |

---

## 6. Endpoints — Tabelas de Frete

### POST /api/fretes/tabelas

Cria tabela de frete.

**Payload:**

```json
{
  "nome": "Frete Sul - Por Peso",
  "tipo_calculo": "POR_PESO",
  "regiao": "SUL",
  "peso_minimo": 0,
  "peso_maximo": 5000,
  "distancia_minima": 0,
  "distancia_maxima": 0,
  "valor_base": 50.00,
  "valor_por_kg": 0.35,
  "valor_por_km": 0,
  "valor_fixo": 0,
  "observacao": "Tabela para entregas na região sul"
}
```

**Resposta (201):**

```json
{
  "status": "success",
  "message": "Tabela de frete criada com sucesso",
  "data": {
    "id": "uuid",
    "nome": "Frete Sul - Por Peso",
    "tipo_calculo": "POR_PESO",
    "regiao": "SUL",
    "peso_minimo": "0.000",
    "peso_maximo": "5000.000",
    "valor_base": "50.00",
    "valor_por_kg": "0.3500",
    "valor_por_km": "0.0000",
    "valor_fixo": "0.00",
    "status": "ATIVA",
    "created_at": "2026-04-19T...",
    "updated_at": "2026-04-19T..."
  }
}
```

### GET /api/fretes/tabelas

Lista tabelas com filtros opcionais.

**Query params:** `status`, `tipo_calculo`, `regiao`, `search`, `page`, `limit`

### GET /api/fretes/tabelas/:id

Retorna tabela específica.

### PUT /api/fretes/tabelas/:id

Atualiza tabela. Mesmo payload do POST.

### PATCH /api/fretes/tabelas/:id/inativar

Inativa uma tabela (sem body).

---

## 7. Endpoints — Fretes Operacionais

### POST /api/fretes/calcular

Calcula e registra frete para uma venda.

**Payload:**

```json
{
  "venda_id": "uuid-da-venda",
  "modalidade": "PROPRIO",
  "regiao_destino": "SUL",
  "peso_total_kg": 1200,
  "distancia_km": 350,
  "tabela_frete_id": "uuid-da-tabela-opcional",
  "transportadora_fornecedor_id": null,
  "observacoes": "Entrega urgente"
}
```

**Resposta (201):**

```json
{
  "status": "success",
  "message": "Frete calculado e registrado com sucesso",
  "data": {
    "id": "uuid-do-frete",
    "venda_id": "uuid-da-venda",
    "tabela_frete_id": "uuid-da-tabela",
    "modalidade": "PROPRIO",
    "tipo_calculo": "POR_PESO",
    "regiao_destino": "SUL",
    "peso_total_kg": "1200.000",
    "distancia_km": "350.00",
    "valor_estimado": "470.00",
    "valor_real": null,
    "veiculo_id": null,
    "transportadora_fornecedor_id": null,
    "status": "CALCULADO",
    "venda_numero": "VND-0042",
    "cliente_nome": "Agro Sul Ltda",
    "cliente_cidade": "Curitiba",
    "cliente_estado": "PR",
    "entrega_id": null,
    "tabela_frete_nome": "Frete Sul - Por Peso"
  }
}
```

### GET /api/fretes

Lista fretes. **Query params:** `status`, `modalidade`, `dataInicio`, `dataFim`, `page`, `limit`

### GET /api/fretes/:id

Retorna frete com dados enriquecidos (venda, cliente, veículo, transportadora, entrega, tabela).

### GET /api/fretes/venda/:vendaId

Retorna frete vinculado a uma venda específica.

### PATCH /api/fretes/:id/vincular-entrega/:entregaId

Vincula frete a uma entrega. Atualiza `entregas.frete_id` e muda status do frete para `VINCULADO`.

### PATCH /api/fretes/:id/vincular-veiculo/:veiculoId

Vincula veículo ao frete (valida se o veículo está ATIVO).

### PATCH /api/fretes/:id/registrar-custo-real

Registra o custo real do frete.

**Payload:**

```json
{
  "custo_real": 520.00,
  "observacoes": "Custo maior por desvio de rota"
}
```

**Resposta (200):**

```json
{
  "status": "success",
  "message": "Custo real registrado com sucesso",
  "data": {
    "id": "uuid",
    "valor_estimado": "470.00",
    "valor_real": "520.00",
    "status": "CALCULADO",
    "..."
  }
}
```

---

## 8. Endpoints Gerenciais

### GET /api/fretes/periodo

Consulta fretes por período com métricas agregadas.

**Query params (obrigatórios):** `dataInicio`, `dataFim`  
**Query params (opcionais):** `status`, `modalidade`, `page`, `limit`

**Resposta:**

```json
{
  "status": "success",
  "data": {
    "fretes": [ ... ],
    "total": 45,
    "metricas": {
      "total_fretes": 45,
      "total_estimado": 21500.00,
      "total_real": 23100.00,
      "media_estimado": 477.78,
      "media_real": 513.33,
      "total_proprio": 30,
      "total_terceiro": 15,
      "total_com_custo_real": 38,
      "diferenca_total": 1600.00
    }
  }
}
```

### GET /api/fretes/regiao/:regiao

Lista fretes de uma região. **Query params:** `status`, `modalidade`, `dataInicio`, `dataFim`, `page`, `limit`

---

## 9. Custo Calculado vs. Custo Real

| Campo | Significado | Quando é preenchido |
| ----- | ----------- | ------------------- |
| `valor_estimado` | Valor calculado automaticamente pela tabela de frete | No momento do `POST /fretes/calcular` |
| `valor_real` | Custo efetivo registrado após a entrega | Via `PATCH /:id/registrar-custo-real` |

A **diferença** (`valor_real - valor_estimado`) representa a margem operacional do frete.  
O endpoint `/periodo` retorna `diferenca_total` para análise em lote.

---

## 10. Integração com Outros Módulos

### Vendas
```
POST /fretes/calcular  →  { venda_id: "uuid" }
```
O frete é calculado passando o `venda_id`. A relação é 1:1 (UNIQUE constraint).

### Entregas
```
PATCH /fretes/:id/vincular-entrega/:entregaId
```
Atualiza `entregas.frete_id` e muda o status do frete para `VINCULADO`.

### Frota
```
PATCH /fretes/:id/vincular-veiculo/:veiculoId
```
Vincula veículo da frota ao frete. Valida se o veículo está com status `ATIVO`.

### Dashboard
O endpoint `GET /fretes/periodo` retorna métricas prontas para consumo pelo dashboard:
- Totais estimados vs. reais
- Média por frete
- Split próprio vs. terceiro
- Total com custo real registrado

### Relatórios
As consultas `GET /fretes/periodo` e `GET /fretes/regiao/:regiao` servem como base para relatórios gerenciais de custo logístico.

---

## 11. Validações Implementadas

| Validação | Local |
| --------- | ----- |
| `tipo_calculo` aceita apenas POR_REGIAO, POR_PESO, POR_DISTANCIA, HIBRIDO | freteValidation |
| `nome` da tabela obrigatório | freteValidation |
| `status` da tabela: ATIVA, INATIVA | freteValidation |
| `peso_minimo ≤ peso_maximo` | freteValidation |
| `distancia_minima ≤ distancia_maxima` | freteValidation |
| Tabela POR_PESO exige valor_por_kg, valor_fixo ou valor_base > 0 | freteValidation |
| Tabela POR_DISTANCIA exige valor_por_km, valor_fixo ou valor_base > 0 | freteValidation |
| Tabela POR_REGIAO exige campo região | freteValidation |
| `venda_id` obrigatório e válido (UUID) para cálculo | freteValidation |
| Modalidade TERCEIRO exige `transportadora_fornecedor_id` | freteValidation |
| `custo_real ≥ 0` | freteValidation |
| Venda existe no banco | freteService |
| Frete duplicado por venda (UNIQUE) | freteService |
| Veículo ativo para vinculação | freteService |
| Entrega não vinculada a outro frete | freteService |
| Tabela ativa para cálculo | freteService |
| Peso/distância dentro dos limites da tabela | freteCalculator |
| Frete cancelado não aceita vinculação/custo | freteService |

---

## 12. Auditoria

Todas as operações de escrita geram log em `logs_auditoria`:
- Criação de tabela de frete
- Atualização de tabela
- Inativação de tabela
- Cálculo de frete
- Vinculação de entrega
- Vinculação de veículo
- Registro de custo real

---

## 13. Observações Finais

- O `freteCalculator.js` é **stateless** — pode ser importado por qualquer módulo (ex: endpoint de simulação de frete no módulo de vendas).
- A migração usa `ADD COLUMN IF NOT EXISTS` e `DROP CONSTRAINT IF EXISTS` para ser idempotente.
- O modelo de dados está preparado para filtros avançados de relatório (região, período, modalidade, status).
