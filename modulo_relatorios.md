# Módulo de Relatórios Gerenciais — Documentação Técnica

## Visão Geral

O módulo de relatórios gerenciais fornece endpoints para consulta paginada e exportação (PDF / Excel) de dados consolidados do sistema. Cada relatório retorna totais agregados e registros detalhados, com suporte a filtros específicos por domínio.

**Base URL:** `GET /api/relatorios/...`

**Autenticação:** JWT obrigatório (Bearer token).

---

## Dependências Adicionadas

| Pacote    | Finalidade              |
| --------- | ----------------------- |
| `pdfkit`  | Geração de PDF in-memory (A4 landscape) |
| `exceljs` | Geração de planilha Excel (.xlsx) in-memory |

---

## Arquivos Criados / Alterados

| Arquivo | Descrição |
| ------- | --------- |
| `src/utils/relatorioValidation.js` | 8 parsers de filtros (vendas, estoque, movimentações, duplicatas, pagamentos, entregas, frota, vendas futuras) |
| `src/models/relatorioModel.js` | 8 queries SQL com construção dinâmica de WHERE + totais via Promise.all |
| `src/utils/exportPdf.js` | Gerador genérico de PDF com PDFKit — cabeçalho, filtros, tabela, totais |
| `src/utils/exportExcel.js` | Gerador genérico de Excel com ExcelJS — título, filtros, tabela com auto-filter, totais |
| `src/services/relatorioService.js` | Camada de serviço: 16 métodos (8 visualização + 8 exportação) |
| `src/controllers/relatorioController.js` | 16 métodos thin — helpers `sendRelatorio()` e `sendExport()` |
| `src/routes/relatorioRoutes.js` | 16 rotas com permissões granulares |
| `src/routes/index.js` | Registra `router.use("/relatorios", relatorioRoutes)` |

---

## Matriz de Permissões

| Rota | Permissões Necessárias |
| ---- | ---------------------- |
| `GET /vendas` | `relatorios.read`, `relatorios.sales.read` |
| `GET /vendas/exportar/pdf` | `relatorios.read`, `relatorios.sales.read`, `relatorios.export` |
| `GET /vendas/exportar/excel` | `relatorios.read`, `relatorios.sales.read`, `relatorios.export` |
| `GET /estoque` | `relatorios.read`, `relatorios.stock.read` |
| `GET /estoque/exportar/pdf` | `relatorios.read`, `relatorios.stock.read`, `relatorios.export` |
| `GET /estoque/exportar/excel` | `relatorios.read`, `relatorios.stock.read`, `relatorios.export` |
| `GET /movimentacoes-estoque` | `relatorios.read`, `relatorios.stock.read` |
| `GET /duplicatas` | `relatorios.read`, `relatorios.finance.read` |
| `GET /duplicatas/exportar/pdf` | `relatorios.read`, `relatorios.finance.read`, `relatorios.export` |
| `GET /duplicatas/exportar/excel` | `relatorios.read`, `relatorios.finance.read`, `relatorios.export` |
| `GET /pagamentos` | `relatorios.read`, `relatorios.finance.read` |
| `GET /entregas` | `relatorios.read`, `relatorios.delivery.read` |
| `GET /entregas/exportar/pdf` | `relatorios.read`, `relatorios.delivery.read`, `relatorios.export` |
| `GET /entregas/exportar/excel` | `relatorios.read`, `relatorios.delivery.read`, `relatorios.export` |
| `GET /frota` | `relatorios.read`, `relatorios.fleet.read` |
| `GET /vendas-futuras` | `relatorios.read`, `relatorios.sales.read` |

---

## Endpoints de Visualização (JSON)

Todos retornam:

```json
{
  "status": "success",
  "data": {
    "totais": { ... },
    "registros": [ ... ],
    "paginacao": { "page": 1, "limit": 50 },
    "filtros_aplicados": { ... }
  }
}
```

### 1. Relatório de Vendas

```
GET /api/relatorios/vendas
```

**Filtros (query string):**

| Parâmetro    | Tipo   | Descrição |
| ------------ | ------ | --------- |
| `dataInicio` | string | Data inicial (YYYY-MM-DD) |
| `dataFim`    | string | Data final (YYYY-MM-DD) |
| `clienteId`  | uuid   | Filtrar por cliente |
| `vendedorId` | uuid   | Filtrar por vendedor |
| `status`     | enum   | `PENDENTE`, `CONFIRMADA`, `FATURADA`, `CANCELADA` |
| `tipoVenda`  | enum   | `NORMAL`, `FUTURA`, `DIRETA` |
| `agrupamento`| enum   | `DIA`, `SEMANA`, `MES` |
| `page`       | int    | Página (padrão: 1) |
| `limit`      | int    | Registros por página (1–500, padrão: 50) |

**Totais retornados:** `total_registros`, `total_valor`, `total_desconto`, `total_frete`, `ticket_medio`

**Colunas:** Número, Cliente, Vendedor, Tipo, Status, Pagamento, Data Venda, Subtotal, Desconto, Frete, Total

---

### 2. Relatório de Estoque

```
GET /api/relatorios/estoque
```

**Filtros:**

| Parâmetro          | Tipo    | Descrição |
| ------------------ | ------- | --------- |
| `localId`          | uuid    | Local de armazenagem |
| `produtoId`        | uuid    | Produto específico |
| `apenasAbaixoMinimo` | string | `"true"` para filtrar abaixo do mínimo |
| `page` / `limit`   | int     | Paginação |

**Totais:** `total_produtos`, `valor_total_custo`, `valor_total_venda`, `itens_abaixo_minimo`

**Colunas:** Código, Produto, Unidade, Categoria, Custo, Venda, Estq. Mínimo, Saldo, Reservado, Disponível

---

### 3. Relatório de Movimentações de Estoque

```
GET /api/relatorios/movimentacoes-estoque
```

**Filtros:**

| Parâmetro          | Tipo | Descrição |
| ------------------ | ---- | --------- |
| `produtoId`        | uuid | Produto |
| `localId`          | uuid | Local |
| `vendedorId`       | uuid | Responsável |
| `tipoMovimentacao` | enum | `ENTRADA`, `SAIDA`, `TRANSFERENCIA`, `AJUSTE` |
| `dataInicio` / `dataFim` | string | Período |
| `page` / `limit`   | int  | Paginação |

**Totais:** `total_registros`, `total_entradas`, `total_saidas`, `total_transferencias`, `total_ajustes`

**Colunas:** Tipo, Produto, Código, Quantidade, Origem, Destino, Motivo, Responsável, Data

---

### 4. Relatório de Duplicatas

```
GET /api/relatorios/duplicatas
```

**Filtros:**

| Parâmetro   | Tipo | Descrição |
| ----------- | ---- | --------- |
| `clienteId` | uuid | Cliente |
| `status`    | enum | `EM_ABERTO`, `PAGO_PARCIALMENTE`, `PAGO`, `VENCIDO`, `CANCELADO` |
| `dataInicio` / `dataFim` | string | Período de vencimento |
| `page` / `limit` | int | Paginação |

**Totais:** `total_registros`, `total_valor`, `total_aberto`, `total_pago`, `total_vencido`

**Colunas:** Número, Parcela, Cliente, CPF/CNPJ, Venda, Valor Total, Valor Aberto, Vencimento, Emissão, Status

---

### 5. Relatório de Pagamentos

```
GET /api/relatorios/pagamentos
```

**Filtros:**

| Parâmetro        | Tipo | Descrição |
| ---------------- | ---- | --------- |
| `formaPagamento` | enum | `PIX`, `BOLETO`, `CARTAO`, `DINHEIRO`, `TRANSFERENCIA` |
| `dataInicio` / `dataFim` | string | Período |
| `page` / `limit` | int | Paginação |

**Totais:** `total_registros`, `total_valor`

**Colunas:** Duplicata, Parcela, Cliente, Forma, Valor, Data Pgto, Ref. Externa, Recebido Por

---

### 6. Relatório de Entregas

```
GET /api/relatorios/entregas
```

**Filtros:**

| Parâmetro    | Tipo | Descrição |
| ------------ | ---- | --------- |
| `status`     | enum | `AGUARDANDO_DESPACHO`, `EM_TRANSITO`, `ENTREGUE`, `NAO_REALIZADA` |
| `veiculoId`  | uuid | Veículo |
| `vendedorId` | uuid | Responsável |
| `dataInicio` / `dataFim` | string | Período |
| `page` / `limit` | int | Paginação |

**Totais:** `total_registros`, `total_aguardando`, `total_em_transito`, `total_entregues`, `total_nao_realizadas`

**Colunas:** Venda, Cliente, Status, Veículo, Modelo, Responsável, Saída, Entrega Realiz., Prev. Entrega, Tentativas

---

### 7. Relatório de Frota / Manutenções

```
GET /api/relatorios/frota
```

**Filtros:**

| Parâmetro        | Tipo | Descrição |
| ---------------- | ---- | --------- |
| `veiculoId`      | uuid | Veículo |
| `status`         | enum | `AGENDADA`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA` |
| `tipoManutencao` | enum | `PREVENTIVA`, `CORRETIVA` |
| `dataInicio` / `dataFim` | string | Período |
| `page` / `limit` | int | Paginação |

**Totais:** `total_registros`, `total_custo`, `total_preventivas`, `total_corretivas`

**Colunas:** Veículo, Modelo, Marca, Tipo, Descrição, Data, Custo, Status, Km, Fornecedor

---

### 8. Relatório de Vendas Futuras

```
GET /api/relatorios/vendas-futuras
```

**Filtros:**

| Parâmetro   | Tipo | Descrição |
| ----------- | ---- | --------- |
| `clienteId` | uuid | Cliente |
| `status`    | enum | `PENDENTE`, `CONFIRMADA`, `FATURADA`, `CANCELADA` |
| `dataInicio` / `dataFim` | string | Período |
| `page` / `limit` | int | Paginação |

**Totais:** `total_registros`, `total_valor`

**Colunas:** Número, Cliente, CPF/CNPJ, Vendedor, Status, Pagamento, Data Venda, Entrega Prev., Total

---

## Endpoints de Exportação

Disponíveis para: **vendas**, **estoque**, **duplicatas** e **entregas**.

### Formato da URL

```
GET /api/relatorios/{recurso}/exportar/pdf
GET /api/relatorios/{recurso}/exportar/excel
```

### Comportamento

- Aceitam os **mesmos filtros** do endpoint de visualização correspondente.
- **PDF:** Limite de 5.000 registros. Retorna `application/pdf`.
- **Excel:** Limite de 50.000 registros. Retorna `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Headers de resposta: `Content-Type`, `Content-Disposition` (attachment), `Content-Length`.

### Rotas de Exportação

| Rota | Formato |
| ---- | ------- |
| `GET /api/relatorios/vendas/exportar/pdf` | PDF |
| `GET /api/relatorios/vendas/exportar/excel` | Excel |
| `GET /api/relatorios/estoque/exportar/pdf` | PDF |
| `GET /api/relatorios/estoque/exportar/excel` | Excel |
| `GET /api/relatorios/duplicatas/exportar/pdf` | PDF |
| `GET /api/relatorios/duplicatas/exportar/excel` | Excel |
| `GET /api/relatorios/entregas/exportar/pdf` | PDF |
| `GET /api/relatorios/entregas/exportar/excel` | Excel |

---

## Estratégia de Exportação

```
┌──────────────────────────────────────────────┐
│           Requisição (mesmos filtros)         │
└──────────────────┬───────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   relatorioModel   │ ← mesma query SQL
         │    (limit alto)    │
         └─────────┬─────────┘
                   │
          ┌────────▼────────┐
          │  Buffer in-memory │
          │  (PDF ou Excel)   │
          └────────┬────────┘
                   │
         ┌─────────▼─────────┐
         │   res.send(buffer) │
         │ Content-Disposition│
         └───────────────────┘
```

- **Reutilização:** O mesmo model query é usado para visualização e exportação; apenas `limit` e `offset` diferem.
- **Sem disco:** Os arquivos são gerados inteiramente em memória e enviados diretamente ao cliente.
- **Colunas compartilhadas:** O objeto `COLUNAS` no service define as colunas para ambos os formatos (PDF e Excel).

---

## Gerador de PDF (`exportPdf.js`)

- Usa `PDFKit` com layout `landscape`, tamanho `A4`.
- Cabeçalho com título centralizado e data de geração.
- Bloco de filtros aplicados (quando presentes).
- Tabela com header em fundo `#2c3e50` (texto branco), linhas alternadas (zebra).
- Quebra de página automática quando o conteúdo ultrapassa a área útil.
- Rodapé com bloco de totais.
- Retorna `Buffer`.

## Gerador de Excel (`exportExcel.js`)

- Usa `ExcelJS` com uma worksheet nomeada "Relatório".
- Linha de título (merge, fonte bold 14, fundo azul escuro).
- Linha de filtros aplicados (quando presentes, merge, fonte italic).
- Header da tabela com fundo verde `FF4CAF50`, fonte branca, auto-filter habilitado.
- Colunas com largura definida pelo objeto `COLUNAS`.
- Linha de totais ao final com rótulo "TOTAIS".
- Retorna `Buffer`.

---

## Exemplos de Uso

### Consultar vendas com filtros

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/relatorios/vendas?dataInicio=2025-01-01&dataFim=2025-06-30&status=CONFIRMADA&page=1&limit=20"
```

### Exportar duplicatas em PDF

```bash
curl -H "Authorization: Bearer <token>" \
  -o duplicatas.pdf \
  "http://localhost:3000/api/relatorios/duplicatas/exportar/pdf?status=VENCIDO"
```

### Exportar estoque em Excel

```bash
curl -H "Authorization: Bearer <token>" \
  -o estoque.xlsx \
  "http://localhost:3000/api/relatorios/estoque/exportar/excel?apenasAbaixoMinimo=true"
```

---

## Observações

- **Relatórios sem exportação (movimentações, pagamentos, frota, vendas futuras):** Não possuem endpoint de exportação nesta versão. Podem ser adicionados futuramente seguindo o mesmo padrão.
- **Agendamento:** A arquitetura (query → buffer → resposta) facilita a futura implementação de relatórios agendados com armazenamento em S3/MinIO e notificação por e-mail.
- **Performance:** Queries usam `LIMIT`/`OFFSET` com índices adequados. Para volumes muito grandes, considerar cursor-based pagination.
