# MÓDULO FINANCEIRO — DUPLICATAS E PAGAMENTOS

## 1. Explicação da Implementação

O módulo financeiro foi construído seguindo a **arquitetura MSC** do projeto, com separação clara de responsabilidades:

- **Models** (`duplicataModel.js`, `pagamentoModel.js`): Acesso exclusivo ao banco de dados via queries parametrizadas
- **Service** (`financeiroService.js`): Toda lógica de negócio — validações cruzadas, recálculo de saldo/status, geração de parcelas
- **Controller** (`financeiroController.js`): Camada fina que recebe requests e delega ao service
- **Validation** (`financeiroValidation.js`): Sanitização, parsing e validação de entrada
- **Routes** (`financeiroRoutes.js`): Definição de rotas com autenticação e autorização

### Estratégia de recálculo de saldo e status
Após cada pagamento registrado, o sistema:
1. Soma todos os pagamentos existentes para a duplicata
2. Calcula `valor_aberto = valor_total - soma_pagamentos`
3. Define o novo status automaticamente:
   - `PAGO` se `valor_aberto <= 0`
   - `PAGO_PARCIALMENTE` se já houve pagamento mas falta valor
   - `VENCIDO` se a data de vencimento passou sem quitação
   - `EM_ABERTO` nos demais casos

---

## 2. Estrutura dos Arquivos

```
backend/src/
├── controllers/
│   └── financeiroController.js
├── models/
│   ├── duplicataModel.js
│   └── pagamentoModel.js
├── routes/
│   ├── financeiroRoutes.js
│   └── index.js              ← atualizado
├── services/
│   └── financeiroService.js
└── utils/
    └── financeiroValidation.js
```

---

## 3. Rotas Implementadas

| Método | Rota                                        | Permissão           | Descrição                           |
|--------|---------------------------------------------|---------------------|-------------------------------------|
| POST   | `/financeiro/duplicatas/gerar`              | financeiro.create    | Gerar duplicata única               |
| POST   | `/financeiro/duplicatas/gerar-parcelas`     | financeiro.create    | Gerar múltiplas parcelas            |
| GET    | `/financeiro/duplicatas`                    | financeiro.read      | Listar com filtros e paginação      |
| GET    | `/financeiro/duplicatas/:id`                | financeiro.read      | Buscar duplicata por ID             |
| GET    | `/financeiro/duplicatas/status/:status`     | financeiro.read      | Filtrar por status                  |
| GET    | `/financeiro/duplicatas/cliente/:clienteId` | financeiro.read      | Filtrar por cliente                 |
| POST   | `/financeiro/duplicatas/:id/pagamentos`     | financeiro.create    | Registrar pagamento                 |
| GET    | `/financeiro/duplicatas/:id/pagamentos`     | financeiro.read      | Listar pagamentos de uma duplicata  |
| GET    | `/financeiro/duplicatas/alertas/vencidas`   | financeiro.read      | Duplicatas vencidas não quitadas    |
| GET    | `/financeiro/duplicatas/alertas/vencendo`   | financeiro.read      | Vencendo nos próximos X dias        |
| GET    | `/financeiro/resumo`                        | financeiro.read      | Resumo financeiro para dashboard    |

---

## 4. Validações Implementadas

### Duplicata
- `venda_id` — obrigatório, UUID válido, venda deve existir
- `cliente_id` — obrigatório, UUID válido, cliente deve existir e estar ativo
- `numero` — obrigatório, único no sistema
- `valor_total` — obrigatório, numérico, maior que zero
- `vencimento` — obrigatório, data válida
- `parcela` — inteiro maior que zero

### Parcelas
- `total_parcelas` — inteiro entre 1 e 120
- `primeiro_vencimento` — obrigatório, data válida
- `intervalo_dias` — inteiro maior que zero (default 30)
- `prefixo_numero` — obrigatório (para gerar números como `DUP-001-01/3`)
- Divisão de valor com ajuste de centavos na primeira parcela

### Pagamento
- `valor` — obrigatório, maior que zero
- Não permite valor acima do saldo em aberto
- `forma_pagamento` — obrigatório, valores aceitos: `PIX`, `BOLETO`, `CARTAO`, `DINHEIRO`, `TRANSFERENCIA`
- Não permite pagamento em duplicata com status `CANCELADO` ou `PAGO`

---

## 5. Tratamento de Erros

- Duplicata não encontrada → 404
- Venda não encontrada → 404
- Cliente não encontrado → 404
- Cliente inativo → 400
- Número duplicado → 409
- Pagamento acima do saldo → 400
- Status inválido → 400
- UUID inválido → 400
- Parâmetros de paginação inválidos → 400
- Dados obrigatórios ausentes → 400

---

## 6. Exemplos de Payload

### 6.1 Gerar duplicata única

```json
POST /financeiro/duplicatas/gerar

{
  "venda_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cliente_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "numero": "DUP-2026-0001",
  "valor_total": 1500.00,
  "vencimento": "2026-05-19",
  "parcela": 1,
  "observacoes": "Venda a prazo - 30 dias"
}
```

### 6.2 Gerar duplicatas parceladas

```json
POST /financeiro/duplicatas/gerar-parcelas

{
  "venda_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cliente_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "valor_total": 3000.00,
  "total_parcelas": 3,
  "primeiro_vencimento": "2026-05-19",
  "intervalo_dias": 30,
  "prefixo_numero": "DUP-2026-V42",
  "observacoes": "Parcelamento em 3x"
}
```

Resultado: 3 duplicatas com números `DUP-2026-V42-01/3`, `DUP-2026-V42-02/3`, `DUP-2026-V42-03/3`, com valor de R$ 1000,00 cada.

### 6.3 Registrar pagamento

```json
POST /financeiro/duplicatas/:id/pagamentos

{
  "valor": 500.00,
  "forma_pagamento": "PIX",
  "data_pagamento": "2026-04-19T10:30:00.000Z",
  "referencia_externa": "PIX-TXN-12345",
  "observacoes": "Pagamento parcial via PIX"
}
```

---

## 7. Exemplo de Resposta da API

### Duplicata gerada

```json
{
  "status": "success",
  "message": "Duplicata gerada com sucesso",
  "data": {
    "id": "...",
    "venda_id": "...",
    "cliente_id": "...",
    "numero": "DUP-2026-0001",
    "parcela": 1,
    "valor_total": "1500.00",
    "valor_pago": 0,
    "valor_aberto": "1500.00",
    "vencimento": "2026-05-19",
    "data_emissao": "2026-04-19",
    "status": "EM_ABERTO",
    "observacoes": "Venda a prazo - 30 dias",
    "cliente": {
      "id": "...",
      "razao_social": "Fazenda Boa Vista Ltda",
      "nome_fantasia": "Boa Vista",
      "cpf_cnpj": "12.345.678/0001-90"
    },
    "venda": {
      "id": "...",
      "numero": "VND-2026-0042",
      "total_valor": "3000.00"
    },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Pagamento registrado

```json
{
  "status": "success",
  "message": "Pagamento registrado com sucesso",
  "data": {
    "pagamento": {
      "id": "...",
      "duplicata_id": "...",
      "recebido_por_usuario_id": "...",
      "recebido_por_nome": "Admin",
      "forma_pagamento": "PIX",
      "valor": "500.00",
      "data_pagamento": "2026-04-19T10:30:00.000Z",
      "referencia_externa": "PIX-TXN-12345",
      "observacoes": "Pagamento parcial via PIX",
      "created_at": "..."
    },
    "duplicata": {
      "id": "...",
      "numero": "DUP-2026-0001",
      "valor_total": "1500.00",
      "valor_pago": 500,
      "valor_aberto": "1000.00",
      "status": "PAGO_PARCIALMENTE"
    }
  }
}
```

---

## 8. Estrutura de Alertas

### Vencidas
`GET /financeiro/duplicatas/alertas/vencidas`

Retorna todas as duplicatas com `vencimento < hoje` e status `EM_ABERTO` ou `PAGO_PARCIALMENTE`.

### Vencendo
`GET /financeiro/duplicatas/alertas/vencendo?dias=7`

Retorna duplicatas com vencimento entre hoje e hoje + X dias (default 7), com status `EM_ABERTO` ou `PAGO_PARCIALMENTE`.

---

## 9. Resumo Financeiro (Dashboard)

`GET /financeiro/resumo`

Retorna:
- Total de duplicatas por status
- Valor total geral
- Valor total em aberto
- Valor total recebido
- Total de duplicatas vencidas não quitadas

---

## 10. Integração com `index.js`

A rota já foi registrada em `src/routes/index.js`:

```javascript
const financeiroRoutes = require("./financeiroRoutes");
// ...
router.use("/financeiro", financeiroRoutes);
```

Todas as rotas ficam acessíveis sob o prefixo `/financeiro/`.

---

## 11. Permissões Utilizadas

| Permissão            | Uso                                    |
|----------------------|----------------------------------------|
| `financeiro.create`  | Gerar duplicatas, registrar pagamentos |
| `financeiro.read`    | Listar, buscar, filtrar, alertas, resumo |

Para funcionar, o módulo `financeiro` deve estar cadastrado na tabela `permissoes` do banco de dados, associado ao perfil de acesso do usuário.
