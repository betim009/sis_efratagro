# MÓDULO DE DASHBOARD GERENCIAL COM MÉTRICAS, ALERTAS E CONSOLIDAÇÕES

## 1. Explicação da Implementação

O módulo de Dashboard foi construído como uma camada de **leitura agregada** sobre os módulos existentes do ERP (vendas, financeiro, estoque, frota, entregas). Não duplica dados nem introduz tabelas próprias — todas as métricas vêm de queries diretas nas tabelas de negócio.

### Decisões técnicas:
- **Query única por bloco**: cada endpoint executa uma ou poucas queries agregadas, evitando N+1
- **`Promise.all`** para paralelizar queries independentes dentro do mesmo endpoint
- **`generate_series`** na série temporal para garantir que períodos sem vendas retornem com valor zero
- **Endpoint `/completo`** executa todos os blocos em paralelo, permitindo que o frontend monte o dashboard inteiro com uma única chamada HTTP
- **Filtros padronizados**: validação centralizada em `dashboardValidation.js`
- **Ausência de dados tratada**: `COALESCE(SUM(...), 0)` e arrays vazios — nunca retorna `null` onde o frontend espera número

---

## 2. Estratégia de Organização

```
Requisição HTTP
  → dashboardRoutes.js (auth + permissão)
    → dashboardController.js (thin: repassa query params)
      → dashboardService.js (orquestra, valida filtros, formata resposta)
        → dashboardModel.js (queries agregadas PostgreSQL)
```

- **Model**: SQL puro com queries parametrizadas, sem ORM
- **Service**: validação de filtros via `dashboardValidation.js`, paralelização, formatação numérica
- **Controller**: delega tudo ao service, padrão `{ status: "success", data }`
- **Routes**: auth obrigatório + permissões granulares por bloco

---

## 3. Estrutura dos Arquivos

```
backend/src/
├── controllers/
│   └── dashboardController.js       ← 9 métodos thin
├── models/
│   └── dashboardModel.js            ← 16 queries agregadas
├── routes/
│   ├── dashboardRoutes.js           ← 9 rotas protegidas
│   └── index.js                     ← atualizado
├── services/
│   └── dashboardService.js          ← orquestração + formatação
└── utils/
    └── dashboardValidation.js       ← validação de filtros
```

---

## 4. Rotas Implementadas

| Método | Rota                         | Permissões                              | Descrição                        |
|--------|------------------------------|-----------------------------------------|----------------------------------|
| GET    | `/dashboard/resumo`          | dashboard.read                          | Visão geral consolidada          |
| GET    | `/dashboard/vendas`          | dashboard.read, dashboard.sales.read    | Métricas de vendas + top vendedores |
| GET    | `/dashboard/financeiro`      | dashboard.read, dashboard.finance.read  | Duplicatas em aberto e vencidas  |
| GET    | `/dashboard/estoque`         | dashboard.read, dashboard.stock.read    | Estoque baixo + saldo por local  |
| GET    | `/dashboard/vendas-futuras`  | dashboard.read, dashboard.sales.read    | Pedidos futuros pendentes        |
| GET    | `/dashboard/frota`           | dashboard.read, dashboard.fleet.read    | Veículos, manutenção, custos     |
| GET    | `/dashboard/series/vendas`   | dashboard.read, dashboard.sales.read    | Série temporal configurável      |
| GET    | `/dashboard/alertas`         | dashboard.read, dashboard.alerts.read   | 5 tipos de alertas consolidados  |
| GET    | `/dashboard/completo`        | dashboard.read                          | Todos os blocos em paralelo      |

---

## 5. Parâmetros de Filtro

| Parâmetro     | Tipo    | Onde se aplica                     | Padrão        |
|---------------|---------|-------------------------------------|---------------|
| `dataInicio`  | date    | vendas, frota, series               | últimos 30d (series) |
| `dataFim`     | date    | vendas, frota, series               | hoje (series)  |
| `localId`     | UUID    | estoque                             | —             |
| `unidadeId`   | UUID    | preparado, sem uso atual            | —             |
| `granularidade` | enum | series (DIA, SEMANA, MES)           | DIA           |
| `dias`        | int     | financeiro, alertas, vendas-futuras | 7             |
| `limit`       | int     | estoque (top reposição)             | 10            |

---

## 6. Exemplos de Resposta

### 6.1 GET /dashboard/resumo

```json
{
  "status": "success",
  "data": {
    "vendas": {
      "total_dia": 45320.50,
      "total_semana": 187450.00,
      "total_mes": 823100.75,
      "quantidade_dia": 12,
      "quantidade_semana": 48,
      "quantidade_mes": 195
    },
    "contadores": {
      "clientes_ativos": 342,
      "produtos_ativos": 1250,
      "entregas_pendentes": 18,
      "veiculos_em_manutencao": 2
    }
  }
}
```

### 6.2 GET /dashboard/vendas?dataInicio=2026-04-01&dataFim=2026-04-19

```json
{
  "status": "success",
  "data": {
    "metricas": {
      "total_pedidos": 195,
      "valor_total": 823100.75,
      "ticket_medio": 4221.54,
      "total_descontos": 12450.00,
      "total_frete": 8930.00,
      "por_tipo": {
        "normais": 150,
        "futuras": 30,
        "diretas": 15
      },
      "por_status": {
        "pendentes": 20,
        "confirmadas": 45,
        "faturadas": 130
      }
    },
    "top_vendedores": [
      {
        "vendedor_id": "...",
        "vendedor_nome": "João Silva",
        "total_pedidos": 42,
        "valor_total": 185200.00
      }
    ],
    "filtros_aplicados": {
      "dataInicio": "2026-04-01",
      "dataFim": "2026-04-19"
    }
  }
}
```

### 6.3 GET /dashboard/financeiro?dias=15

```json
{
  "status": "success",
  "data": {
    "metricas": {
      "total_em_aberto": 85,
      "valor_total_em_aberto": 234500.00,
      "total_vencidas": 12,
      "valor_total_vencido": 45300.00,
      "vencendo_em_x_dias": 8
    },
    "filtros_aplicados": { "dias": 15 }
  }
}
```

### 6.4 GET /dashboard/estoque?localId=uuid&limit=5

```json
{
  "status": "success",
  "data": {
    "metricas": {
      "total_produtos_abaixo_minimo": 23
    },
    "top_reposicao": [
      {
        "id": "...",
        "codigo": "FERT-001",
        "nome": "Fertilizante NPK",
        "unidade_medida": "KG",
        "estoque_minimo": 500,
        "ponto_reposicao": 300,
        "saldo_atual": 120,
        "reservado": 50,
        "deficit": 380
      }
    ],
    "saldo_por_local": [
      {
        "local_id": "...",
        "local_nome": "Depósito Central",
        "local_codigo": "DEP-01",
        "tipo_local": "DEPOSITO",
        "total_produtos": 450,
        "saldo_total": 12500,
        "total_reservado": 3200
      }
    ],
    "filtros_aplicados": {
      "localId": "uuid",
      "limit": 5
    }
  }
}
```

### 6.5 GET /dashboard/vendas-futuras?dias=15

```json
{
  "status": "success",
  "data": {
    "metricas": {
      "total_pedidos_futuros": 30,
      "valor_total_previsto": 156800.00,
      "pendentes": 12,
      "confirmados": 18,
      "prazo_proximo": 5
    },
    "filtros_aplicados": { "dias": 15 }
  }
}
```

### 6.6 GET /dashboard/frota?dataInicio=2026-01-01&dataFim=2026-04-19

```json
{
  "status": "success",
  "data": {
    "metricas": {
      "veiculos_em_manutencao": 2,
      "veiculos_ativos": 8,
      "veiculos_inativos": 1,
      "total_veiculos": 11,
      "total_gasto_manutencao": 45800.00,
      "total_preventivas": 22,
      "total_corretivas": 7,
      "manutencoes_ativas": 3
    },
    "filtros_aplicados": {
      "dataInicio": "2026-01-01",
      "dataFim": "2026-04-19"
    }
  }
}
```

### 6.7 GET /dashboard/series/vendas?granularidade=SEMANA&dataInicio=2026-03-01&dataFim=2026-04-19

```json
{
  "status": "success",
  "data": {
    "series": [
      { "periodo": "2026-03-02", "quantidade_pedidos": 32, "valor_total": 124500.00 },
      { "periodo": "2026-03-09", "quantidade_pedidos": 45, "valor_total": 187200.00 },
      { "periodo": "2026-03-16", "quantidade_pedidos": 38, "valor_total": 156800.00 }
    ],
    "filtros_aplicados": {
      "granularidade": "SEMANA",
      "dataInicio": "2026-03-01",
      "dataFim": "2026-04-19"
    }
  }
}
```

### 6.8 GET /dashboard/alertas?dias=7

```json
{
  "status": "success",
  "data": {
    "estoque_baixo": {
      "total": 3,
      "itens": [
        { "id": "...", "codigo": "FERT-001", "nome": "Fertilizante NPK", "estoque_minimo": 500, "saldo_atual": 120 }
      ]
    },
    "duplicatas_vencidas": {
      "total": 2,
      "itens": [
        { "id": "...", "numero": "DUP-001/1", "parcela": 1, "valor_total": 5000, "valor_aberto": 3000, "vencimento": "2026-04-10", "status": "VENCIDO", "cliente_nome": "Fazenda Boa Vista" }
      ]
    },
    "vendas_futuras_proximas": {
      "total": 1,
      "itens": [
        { "id": "...", "numero": "VF-001", "total_valor": 12500, "data_entrega_prevista": "2026-04-22", "status": "CONFIRMADA", "cliente_nome": "Agro Norte" }
      ]
    },
    "manutencao_preventiva": {
      "total": 1,
      "itens": [
        { "id": "...", "descricao": "Troca de óleo", "proxima_manutencao_data": "2026-04-25", "proxima_manutencao_km": null, "veiculo_id": "...", "placa": "ABC-1D23", "modelo": "VW Delivery", "quilometragem_atual": 45000 }
      ]
    },
    "entregas_pendentes": {
      "total": 2,
      "itens": [
        { "id": "...", "status": "EM_TRANSITO", "data_saida": "2026-04-18T08:00:00Z", "tentativa_atual": 1, "venda_numero": "V-001", "data_entrega_prevista": "2026-04-19", "cliente_nome": "Fazenda Boa Vista" }
      ]
    }
  }
}
```

### 6.9 GET /dashboard/completo

Retorna todos os blocos acima em uma única resposta:

```json
{
  "status": "success",
  "data": {
    "resumo": { "vendas": { ... }, "contadores": { ... } },
    "vendas": { "metricas": { ... }, "top_vendedores": [...], "filtros_aplicados": { ... } },
    "financeiro": { "metricas": { ... }, "filtros_aplicados": { ... } },
    "estoque": { "metricas": { ... }, "top_reposicao": [...], "saldo_por_local": [...], "filtros_aplicados": { ... } },
    "vendas_futuras": { "metricas": { ... }, "filtros_aplicados": { ... } },
    "frota": { "metricas": { ... }, "filtros_aplicados": { ... } },
    "alertas": { "estoque_baixo": { ... }, "duplicatas_vencidas": { ... }, ... }
  }
}
```

---

## 7. Estratégia de Performance

| Técnica | Onde |
|---------|------|
| **Query agregada única** | Cada endpoint faz 1-3 queries, não N+1 |
| **`Promise.all`** | Service paraleliza queries independentes |
| **`COALESCE + CASE WHEN`** | Evita múltiplas queries por status/tipo |
| **`generate_series`** | Série temporal sem "buracos" sem query extra |
| **`DATE_TRUNC`** | Agrupamento temporal eficiente no PostgreSQL |
| **Sem JOINs desnecessários** | Subqueries em contadores são mais rápidos que LEFT JOIN em tabelas grandes |
| **Endpoint `/completo`** | 1 HTTP request = ~12 queries paralelas vs 9 requests separados |

---

## 8. Preparação para Consumo no Frontend

- Todos os valores numéricos são convertidos com `Number()` — nunca retornam como string
- Respostas são estáveis: campos sempre existem, arrays podem ser vazios, números nunca `null`
- `filtros_aplicados` retornado em cada endpoint para o frontend saber exatamente o que foi usado
- Série temporal com `generate_series` garante eixo X contínuo para gráficos
- Endpoint `/completo` evita múltiplas chamadas na montagem do dashboard

---

## 9. Permissões por Módulo

O sistema de permissões usa a mesma estrutura existente (`perfil_permissoes.modulo`):

| Módulo no banco            | Ação  | Endpoints que protege                          |
|----------------------------|-------|------------------------------------------------|
| `dashboard`                | read  | Todos os endpoints do dashboard                |
| `dashboard.sales`          | read  | `/vendas`, `/vendas-futuras`, `/series/vendas` |
| `dashboard.finance`        | read  | `/financeiro`                                  |
| `dashboard.stock`          | read  | `/estoque`                                     |
| `dashboard.fleet`          | read  | `/frota`                                       |
| `dashboard.alerts`         | read  | `/alertas`                                     |

O endpoint `/resumo` e `/completo` exigem apenas `dashboard.read`.

---

## 10. Integração com index.js

Já registrado:

```javascript
const dashboardRoutes = require("./dashboardRoutes");
router.use("/dashboard", dashboardRoutes);
```

Todas as rotas acessíveis sob `/dashboard/`.
