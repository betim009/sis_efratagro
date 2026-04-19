# 📋 Especificação de Requisitos do Sistema — ERP Comercial

> **Versão:** 2.1  
> **Status:** Rascunho revisado  
> **Origem:** Esboço manual + atualização técnica pontual

---

## 1. Visão Geral

Sistema ERP voltado para gestão comercial de uma empresa distribuidora/varejista. Engloba cadastros base, controle de vendas, estoque por localização, frota, financeiro (duplicatas), e relatórios gerenciais.

---

## 2. Personas e Usuários

| Perfil | Descrição |
|--------|-----------|
| Administrador | Acesso total ao sistema, configurações e relatórios |
| Vendedor | Registra vendas, consulta clientes e produtos |
| Estoquista | Gerencia entradas/saídas e saldo de estoque |
| Motorista / Logística | Acompanha entregas e status de frota |
| Financeiro | Acessa duplicatas, cobranças e relatórios financeiros |
| Gerente | Dashboard, relatórios e visão consolidada |

---

## 3. Módulos e Requisitos Funcionais

### 3.1 Cadastros Base (CAD)

#### 3.1.1 Fornecedor
- [ ] Cadastrar, editar, inativar e consultar fornecedores
- [ ] Campos: razão social, nome fantasia, CNPJ/CPF, endereço, telefone, e-mail, contato responsável
- [ ] Histórico de compras por fornecedor
- [ ] Status: Ativo / Inativo

#### 3.1.2 Cliente
- [ ] Cadastrar, editar, inativar e consultar clientes
- [ ] Campos: nome/razão social, CPF/CNPJ, endereço completo, telefone, e-mail, limite de crédito
- [ ] Segmentação por tipo: pessoa física / jurídica
- [ ] Histórico de compras e débitos em aberto
- [ ] Status: Ativo / Bloqueado / Inativo

#### 3.1.3 Produto
- [ ] Cadastrar, editar, inativar e consultar produtos
- [ ] Campos: código, nome, descrição, unidade de medida, categoria, preço de custo, preço de venda, peso
- [ ] Código de barras / referência interna
- [ ] Vinculação com fornecedor padrão
- [ ] Controle de estoque mínimo e ponto de reposição
- [ ] Status: Ativo / Inativo

---

### 3.2 Vendas

#### 3.2.1 Registro de Venda
- [ ] Criar ordens de venda com seleção de cliente, produto(s) e quantidade
- [ ] Aplicação de descontos por item ou por pedido
- [ ] Cálculo automático de frete (ver módulo Frete)
- [ ] Seleção de forma de pagamento (à vista, prazo, parcelas)
- [ ] Geração automática de duplicata ao confirmar venda (ver módulo Financeiro)

#### 3.2.2 Controle de Entrega
- [ ] Registrar status de entrega para cada venda:
  - `Aguardando despacho`
  - `Em trânsito`
  - `Entregue`
  - `Entrega não realizada`
- [ ] Indicar se a entrega da mercadoria foi **concluída ou não**
- [ ] Histórico de tentativas de entrega com data/hora e observação
- [ ] Notificação interna ao vendedor quando entrega for concluída ou falhar

#### 3.2.3 Venda Futura (Pedido Antecipado)
- [ ] Registrar vendas com data futura de entrega/faturamento
- [ ] Status: `Pendente` / `Confirmado` / `Cancelado`
- [ ] Alerta automático (dashboard + notificação) quando a data da venda futura se aproximar (configurável: X dias antes)
- [ ] Relatório de vendas futuras por período e cliente

#### 3.2.4 Venda Direta ao Cliente
- [ ] Fluxo simplificado de venda balcão / pronta entrega
- [ ] Emissão imediata de comprovante
- [ ] Diferenciação visual entre venda direta e venda com entrega

---

### 3.3 Estoque

#### 3.3.1 Controle por Local
- [ ] Cadastrar múltiplos locais de armazenamento (depósitos, filiais, prateleiras)
- [ ] Entrada e saída de estoque vinculadas a um local específico
- [ ] Transferência de estoque entre locais
- [ ] Consulta de saldo por produto e por local

#### 3.3.2 Movimentações
- [ ] Registrar entradas (compra, devolução de cliente, ajuste)
- [ ] Registrar saídas (venda, devolução a fornecedor, perda, ajuste)
- [ ] Rastreabilidade: toda movimentação deve ter data, responsável e motivo

#### 3.3.3 Alertas de Estoque
- [ ] Notificar quando produto atingir estoque mínimo
- [ ] Bloquear venda se estoque for zero (configurável)

---

### 3.4 Financeiro — Duplicatas

- [ ] Gerar duplicata automaticamente a partir de uma venda a prazo
- [ ] Campos: número, valor, vencimento, cliente, venda de origem, status
- [ ] Status de duplicata: `Em aberto` / `Pago parcialmente` / `Pago` / `Vencido`
- [ ] Registrar pagamentos com data e forma de pagamento
- [ ] Listagem de duplicatas por cliente, período e status
- [ ] Alerta de duplicatas vencendo nos próximos X dias

---

### 3.5 Frota e Manutenção

- [ ] Cadastro de veículos: placa, modelo, ano, tipo, responsável
- [ ] Registro de manutenções: tipo (preventiva/corretiva), data, custo, fornecedor do serviço, descrição
- [ ] Agenda de manutenção preventiva com alertas por quilometragem ou data
- [ ] Histórico completo por veículo
- [ ] Vinculação de veículo a entregas realizadas

---

### 3.6 Dashboard

- [ ] Painel principal com visão consolidada, acessível por perfil
- [ ] Widgets informativos:
  - Saldo de estoque por produto / local
  - Vendas do dia / semana / mês
  - Duplicatas em aberto e vencidas
  - Pedidos de venda futura com prazo próximo
  - Alertas de estoque mínimo
  - Status da frota (veículos em manutenção)
- [ ] Filtros por período e unidade
- [ ] Gráficos de desempenho de vendas (linha do tempo)

---

### 3.7 Relatórios

- [ ] Geração de relatórios nos períodos: **Diário**, **Semanal** e **Anual**
- [ ] Tipos de relatório:
  - Vendas por período, vendedor e cliente
  - Estoque atual e movimentações
  - Duplicatas emitidas e recebidas
  - Entregas realizadas e pendentes
  - Manutenções de frota
  - Vendas futuras
- [ ] Exportação em PDF e Excel
- [ ] Agendamento de relatórios por e-mail (opcional)

---

### 3.8 Controle de Acesso por Usuário

- [ ] Autenticação com login e senha (hash bcrypt ou equivalente)
- [ ] Perfis de acesso com permissões granulares por módulo e ação (CRUD)
- [ ] Log de auditoria: registrar quem fez o quê e quando
- [ ] Redefinição de senha por e-mail ou pelo administrador
- [ ] Suporte a múltiplas sessões com controle de inatividade (timeout)

---

### 3.9 Controle de Frete

- [ ] Cadastro de tabelas de frete por região, peso ou distância
- [ ] Cálculo automático do frete no momento da venda
- [ ] Vincular frete a veículo ou transportadora terceirizada
- [ ] Registrar custo real de frete por entrega
- [ ] Relatório de custo de frete por período e destino

---

## 4. Requisitos Não Funcionais

| Categoria | Requisito |
|-----------|-----------|
| Performance | Respostas de API < 500ms para operações comuns |
| Escalabilidade | Suportar múltiplos usuários simultâneos (mínimo 50 concurrent) |
| Segurança | HTTPS obrigatório, tokens JWT, dados sensíveis criptografados |
| Disponibilidade | Uptime mínimo de 99,5% em horário comercial |
| Backup | Backup automático diário do banco de dados |
| Auditoria | Toda alteração de dado deve ser rastreável (quem, quando, o quê) |
| Responsividade | Interface funcional em desktop e tablet |
| Internacionalização | Sistema em pt-BR, com suporte a formatos de moeda e data brasileiros |

---

## 5. Arquitetura Sugerida

### 5.1 Infraestrutura
- Docker
- Docker Compose

### 5.2 Frontend
- React com Vite
- React Router
- Axios
- Material UI
- React Icons

### 5.3 Backend
- Node.js
- Express.js
- Arquitetura MSC (Models, Services, Controllers)
- Middlewares para autenticação, autorização, tratamento de erros e validações

### 5.4 Banco de Dados
- PostgreSQL

### 5.5 Estrutura de Pastas Sugerida

#### Backend
```txt
/backend
  /src
    /controllers
    /services
    /models
    /middlewares
    /routes
    /database
      migrations.sql
      seeders.sql
    /config
    /utils
  app.js
  server.js
```

#### Frontend
```txt
/frontend
  /src
    /pages
    /components
    /routes
    /services
    /hooks
    /contexts
    /styles
    /utils
  App.jsx
  main.jsx
```

---

## 6. Modelo de Dados — Entidades Principais

```txt
Fornecedor        → id, nome, cnpj, contato, status
Cliente           → id, nome, cpf_cnpj, endereco, limite_credito, status
Produto           → id, nome, codigo, preco_custo, preco_venda, estoque_minimo
Local_Estoque     → id, nome, descricao
Estoque           → id, produto_id, local_id, quantidade
Movimentacao      → id, produto_id, local_id, tipo, quantidade, data, usuario_id, motivo
Venda             → id, cliente_id, data, status_entrega, tipo (direta/futura/normal), total
Item_Venda        → id, venda_id, produto_id, quantidade, preco_unitario, desconto
Entrega           → id, venda_id, veiculo_id, status, data_prevista, data_efetiva, obs
Duplicata         → id, venda_id, cliente_id, valor, vencimento, status
Pagamento         → id, duplicata_id, valor, data, forma_pagamento
Veiculo           → id, placa, modelo, ano, responsavel_id
Manutencao        → id, veiculo_id, tipo, data, custo, descricao
Frete             → id, venda_id, veiculo_id, custo_calculado, custo_real, regiao
Usuario           → id, nome, email, senha_hash, perfil_id
Perfil_Acesso     → id, nome, permissoes (JSON)
Log_Auditoria     → id, usuario_id, tabela, acao, dados_antes, dados_depois, timestamp
```

---

## 7. Fluxos Críticos

### 7.1 Fluxo de Venda Completa
```txt
1. Selecionar cliente → 2. Adicionar produtos → 3. Calcular frete
→ 4. Definir forma de pagamento → 5. Confirmar venda
→ 6. Baixar estoque → 7. Gerar duplicata (se a prazo)
→ 8. Agendar entrega → 9. Atualizar status de entrega
```

### 7.2 Fluxo de Venda Futura
```txt
1. Registrar pedido com data futura → 2. Reservar estoque (opcional)
→ 3. Alertar X dias antes do prazo → 4. Confirmar e converter em venda normal
```

### 7.3 Fluxo de Duplicata
```txt
Venda a prazo confirmada → Gerar duplicata(s) com vencimentos
→ Monitorar vencimento → Registrar pagamento → Fechar duplicata
```

---

## 8. Alertas e Notificações

| Gatilho | Destinatário | Canal |
|---------|-------------|-------|
| Estoque abaixo do mínimo | Estoquista / Gerente | Dashboard + E-mail |
| Venda futura próxima do vencimento | Vendedor / Gerente | Dashboard |
| Duplicata vencida | Financeiro / Gerente | Dashboard + E-mail |
| Manutenção preventiva pendente | Responsável frota | Dashboard |
| Entrega não concluída | Vendedor | Dashboard |

---

## 9. Critérios de Aceite (exemplos)

- [ ] Ao confirmar uma venda a prazo, uma duplicata deve ser gerada automaticamente com os vencimentos corretos
- [ ] O saldo de estoque deve ser atualizado imediatamente após confirmação de venda ou entrada de mercadoria
- [ ] O dashboard deve exibir o saldo de estoque atual sem necessidade de refresh manual
- [ ] Usuários sem permissão não conseguem acessar módulos restritos (retorno 403)
- [ ] Toda movimentação de estoque deve ter auditoria registrada
- [ ] Relatórios devem ser exportáveis em PDF e Excel

---

## 10. Fora do Escopo (v1.0)

- Integração com NF-e / NFS-e (emissão fiscal)
- App mobile nativo
- E-commerce / loja virtual
- Integração com bancos (boleto automático)
- BI avançado / OLAP

> Estes itens podem ser priorizados em versões futuras.

---
