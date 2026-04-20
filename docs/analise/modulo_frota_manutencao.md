# MÓDULO DE FROTA, MANUTENÇÃO E VINCULAÇÃO COM ENTREGAS

## 1. Explicação da Implementação

Módulo construído seguindo a **arquitetura MSC** do projeto, com duas entidades centrais (veículos e manutenções) e integração com entregas via tabela `fretes`.

- **Models** (`veiculoModel.js`, `manutencaoModel.js`): Acesso ao banco com queries parametrizadas
- **Service** (`frotaService.js`): Lógica de negócio — validações cruzadas, transições de status, alertas, vinculação
- **Controller** (`frotaController.js`): Camada fina de request/response
- **Validation** (`frotaValidation.js`): Sanitização, parsing e validação de entrada
- **Routes** (`frotaRoutes.js`): Rotas protegidas com autenticação e autorização

### Regras de status do veículo
- Ao criar manutenção como `EM_EXECUCAO` → veículo muda para `MANUTENCAO`
- Ao concluir/cancelar **todas** as manutenções ativas → veículo volta para `ATIVO`
- Veículo `INATIVO` não pode ser vinculado a entregas

### Vinculação com entregas
O banco vincula veículo a entregas via `fretes.veiculo_id`. A rota `PATCH /frota/entregas/:entregaId/vincular-veiculo/:veiculoId` atualiza o frete associado à entrega.

---

## 2. Estrutura dos Arquivos

```
backend/src/
├── controllers/
│   └── frotaController.js
├── models/
│   ├── veiculoModel.js
│   └── manutencaoModel.js
├── routes/
│   ├── frotaRoutes.js
│   └── index.js              ← atualizado
├── services/
│   └── frotaService.js
└── utils/
    └── frotaValidation.js
```

---

## 3. Rotas Implementadas

### Veículos

| Método | Rota                              | Permissão     | Descrição                     |
|--------|-----------------------------------|---------------|-------------------------------|
| POST   | `/frota/veiculos`                 | frota.create  | Cadastrar veículo             |
| GET    | `/frota/veiculos`                 | frota.read    | Listar com filtros/paginação  |
| GET    | `/frota/veiculos/:id`             | frota.read    | Buscar por ID                 |
| PUT    | `/frota/veiculos/:id`             | frota.update  | Atualizar veículo             |
| PATCH  | `/frota/veiculos/:id/status`      | frota.update  | Alterar status                |
| GET    | `/frota/veiculos/status/:status`  | frota.read    | Filtrar por status            |
| GET    | `/frota/veiculos/:id/historico`   | frota.read    | Histórico completo            |
| GET    | `/frota/veiculos/:id/manutencoes` | frota.read    | Manutenções do veículo        |

### Manutenções

| Método | Rota                              | Permissão     | Descrição                     |
|--------|-----------------------------------|---------------|-------------------------------|
| POST   | `/frota/manutencoes`              | frota.create  | Registrar manutenção          |
| GET    | `/frota/manutencoes`              | frota.read    | Listar com filtros/paginação  |
| GET    | `/frota/manutencoes/:id`          | frota.read    | Buscar por ID                 |
| PUT    | `/frota/manutencoes/:id`          | frota.update  | Atualizar manutenção          |
| PATCH  | `/frota/manutencoes/:id/status`   | frota.update  | Alterar status                |

### Alertas, Relatórios e Entregas

| Método | Rota                                                    | Permissão     | Descrição                           |
|--------|---------------------------------------------------------|---------------|-------------------------------------|
| GET    | `/frota/alertas/manutencao-preventiva`                  | frota.read    | Alertas por data e km               |
| GET    | `/frota/relatorios/custos-manutencao`                   | frota.read    | Relatório de custos por veículo     |
| GET    | `/frota/resumo`                                         | frota.read    | Resumo para dashboard               |
| PATCH  | `/frota/entregas/:entregaId/vincular-veiculo/:veiculoId`| frota.update  | Vincular veículo a entrega          |

---

## 4. Valores aceitos (conforme schema do banco)

- **Tipo de veículo**: `CAMINHAO`, `VAN`, `UTILITARIO`, `MOTO`, `CARRO`
- **Status de veículo**: `ATIVO`, `MANUTENCAO`, `INATIVO`
- **Tipo de manutenção**: `PREVENTIVA`, `CORRETIVA`
- **Status de manutenção**: `AGENDADA`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA`

---

## 5. Exemplos de Payload

### 5.1 Criar veículo

```json
POST /frota/veiculos

{
  "placa": "ABC-1D23",
  "modelo": "VW Delivery 11.180",
  "marca": "Volkswagen",
  "ano_fabricacao": 2023,
  "tipo_veiculo": "CAMINHAO",
  "capacidade_carga_kg": 6500,
  "quilometragem_atual": 45230.5,
  "responsavel_usuario_id": "uuid-do-usuario"
}
```

### 5.2 Criar manutenção preventiva

```json
POST /frota/manutencoes

{
  "veiculo_id": "uuid-do-veiculo",
  "tipo_manutencao": "PREVENTIVA",
  "descricao": "Troca de óleo e filtros",
  "data_manutencao": "2026-04-19",
  "proxima_manutencao_data": "2026-07-19",
  "proxima_manutencao_km": 55000,
  "quilometragem_registrada": 45230.5,
  "custo": 850.00,
  "fornecedor_id": "uuid-do-fornecedor",
  "status": "CONCLUIDA"
}
```

### 5.3 Criar manutenção corretiva

```json
POST /frota/manutencoes

{
  "veiculo_id": "uuid-do-veiculo",
  "tipo_manutencao": "CORRETIVA",
  "descricao": "Reparo no sistema de freios",
  "data_manutencao": "2026-04-20",
  "quilometragem_registrada": 45300,
  "custo": 2200.00,
  "fornecedor_id": "uuid-do-fornecedor",
  "status": "EM_EXECUCAO"
}
```

### 5.4 Atualizar status de manutenção

```json
PATCH /frota/manutencoes/:id/status

{
  "status": "CONCLUIDA"
}
```

### 5.5 Vincular veículo a entrega

```
PATCH /frota/entregas/:entregaId/vincular-veiculo/:veiculoId
```

---

## 6. Exemplo de Resposta

### Veículo criado

```json
{
  "status": "success",
  "message": "Veiculo cadastrado com sucesso",
  "data": {
    "id": "...",
    "placa": "ABC-1D23",
    "modelo": "VW Delivery 11.180",
    "marca": "Volkswagen",
    "ano_fabricacao": 2023,
    "tipo_veiculo": "CAMINHAO",
    "capacidade_carga_kg": "6500.000",
    "quilometragem_atual": "45230.5",
    "responsavel_usuario_id": "...",
    "responsavel": {
      "id": "...",
      "nome": "João Silva"
    },
    "status": "ATIVO",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

## 7. Estratégia de Alertas Preventivos

`GET /frota/alertas/manutencao-preventiva?dias=30`

Retorna dois conjuntos:
- **por_data**: manutenções com `proxima_manutencao_data` dentro dos próximos X dias
- **por_quilometragem**: manutenções onde `quilometragem_atual >= proxima_manutencao_km`

---

## 8. Relatório de Custos

`GET /frota/relatorios/custos-manutencao?veiculo_id=...&data_inicio=2026-01-01&data_fim=2026-12-31`

Retorna custos agrupados por veículo, separando preventivas e corretivas, apenas de manutenções com status `CONCLUIDA`.

---

## 9. Integração com `index.js`

Já registrado:

```javascript
const frotaRoutes = require("./frotaRoutes");
router.use("/frota", frotaRoutes);
```

Todas as rotas acessíveis sob `/frota/`.
