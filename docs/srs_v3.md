# 📋 Especificação de Requisitos do Sistema — ERP Comercial Web Mobile

> **Versão:** 1.0  
> **Status:** Rascunho inicial  
> **Origem:** Derivado do SRS principal com foco específico na experiência web mobile

---

## 1. Visão Geral

Esta versão do sistema ERP é destinada ao uso em navegadores de dispositivos móveis e telas pequenas, mantendo os principais fluxos operacionais do sistema principal, porém com adaptações de interface, navegação e organização visual apropriadas para contexto mobile.

O objetivo desta versão é permitir acesso rápido às funcionalidades mais importantes do sistema, com foco em usabilidade, legibilidade, toque e navegação simplificada.

---

## 2. Objetivo da Versão Web Mobile

A versão web mobile deverá:

- Priorizar a experiência em smartphones
- Reduzir a complexidade visual das telas
- Evitar excesso de informações simultâneas
- Facilitar navegação com o polegar
- Exibir conteúdos em blocos verticais
- Preservar os principais fluxos operacionais do ERP

---

## 3. Diretriz Geral de Interface Mobile

### 3.1 Regra de navegação principal
Na versão web mobile, **não deve existir sidebar fixa lateral**.

A navegação principal deve ser feita por componentes mais apropriados para dispositivos móveis, com foco em acesso inferior, ações rápidas e menus contextuais.

### 3.2 Regra de organização visual
As telas devem evitar composição com múltiplos containers lado a lado.

O padrão visual da versão mobile deve priorizar:

- Um bloco por linha
- Empilhamento vertical de seções
- Cards e containers organizados de cima para baixo
- Espaçamento confortável entre elementos
- Áreas de toque adequadas para uso com os dedos

### 3.3 Regra de densidade de conteúdo
Sempre que possível:

- reduzir excesso de colunas
- evitar tabelas largas
- evitar muitos filtros abertos ao mesmo tempo
- dividir conteúdos complexos em blocos menores
- utilizar componentes expansíveis, colapsáveis ou segmentados

---

## 4. Stack Tecnológica

### 4.1 Infraestrutura
- Docker
- Docker Compose

### 4.2 Frontend
- React com Vite
- React Router
- Axios
- Material UI
- React Icons

### 4.3 Backend
- Node.js
- Express.js
- Arquitetura MSC (Models, Services, Controllers)
- Middlewares para autenticação, autorização, tratamento de erros e validações

### 4.4 Banco de Dados
- PostgreSQL

---

## 5. Componentes Material UI Recomendados para a Versão Mobile

### 5.1 Navegação principal
#### BottomNavigation
Deve ser utilizada como principal componente de navegação entre áreas centrais do sistema mobile, especialmente para acessos frequentes, como:
- Início
- Vendas
- Estoque
- Financeiro
- Perfil ou Menu

#### BottomNavigationAction
Deve ser utilizada junto à BottomNavigation para representar cada destino principal de navegação.

### 5.2 Ações rápidas
#### Fab
Deve ser utilizado para destacar a ação principal da tela, por exemplo:
- Nova venda
- Novo cliente
- Novo produto
- Nova movimentação
- Novo pagamento

#### SpeedDial
Deve ser utilizado quando houver necessidade de agrupar múltiplas ações rápidas relacionadas em um único ponto flutuante da interface.

Exemplos:
- Criar venda
- Criar cliente
- Criar produto
- Registrar pagamento

### 5.3 Componentes adicionais recomendados para telas pequenas
- AppBar
- Toolbar
- Stack
- Box
- Card
- Paper
- Accordion
- Tabs
- Dialog
- Drawer temporário
- List e ListItem
- Chip
- Snackbar
- TextField
- Select
- Skeleton
- Divider

---

## 6. Diretrizes de Layout Responsivo

### 6.1 Estrutura visual
A versão mobile deve priorizar layout em coluna única.

Exemplos de diretriz:
- filtros acima da listagem
- resumo acima da tabela
- botões abaixo ou acima do conteúdo principal
- cards um abaixo do outro
- blocos de informação organizados verticalmente

### 6.2 Containers lado a lado
Containers lado a lado devem ser evitados em telas pequenas.

Só poderão existir lado a lado quando:
- houver espaço suficiente
- o conteúdo for muito curto
- a leitura e o toque não forem prejudicados

Mesmo nesses casos, o comportamento padrão deve ser de quebra para uma coluna.

### 6.3 Grid e distribuição
Quando houver uso de grid, ele deve priorizar:
- 1 coluna em telas pequenas
- 2 colunas apenas em situações bem controladas
- leitura confortável
- espaçamento adequado

### 6.4 Tabelas
Tabelas extensas não devem ser priorizadas na versão mobile.

Alternativas recomendadas:
- cards por item
- listas detalhadas
- accordions
- blocos resumidos com botão de detalhes

---

## 7. Diretrizes de UX para Mobile

- botões com área de toque confortável
- textos legíveis sem necessidade de zoom
- navegação simplificada
- foco nas ações principais da tela
- reduzir quantidade de elementos visíveis ao mesmo tempo
- evitar menus complexos
- evitar excesso de inputs em uma única tela
- priorizar fluxos curtos e objetivos

---

## 8. Módulos Prioritários para a Versão Mobile

A versão web mobile deve priorizar módulos com maior necessidade operacional em campo ou uso rápido:

- Dashboard resumido
- Consulta de clientes
- Consulta de produtos
- Registro de venda
- Consulta de estoque
- Movimentações rápidas
- Consulta de duplicatas
- Status de entrega
- Acompanhamento de frota
- Alertas e notificações

---

## 9. Estrutura de Pastas Sugerida

### 9.1 Backend
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

### 9.2 Frontend Mobile Web
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
    /layouts
    /mobile
  App.jsx
  main.jsx
```

---

## 10. Critérios de Aceite da Versão Mobile

- [ ] A versão web mobile não deve usar sidebar fixa lateral
- [ ] A navegação principal deve priorizar componentes adequados para mobile
- [ ] O layout deve priorizar organização vertical
- [ ] Containers lado a lado devem ser evitados em telas pequenas
- [ ] Ações principais devem estar acessíveis com poucos toques
- [ ] Os módulos principais devem funcionar corretamente em smartphone
- [ ] A interface deve ser legível e utilizável sem zoom
- [ ] O sistema deve apresentar boa experiência de uso em larguras reduzidas

---

## 11. Fora do Escopo desta Versão Mobile

- replicar integralmente a densidade da versão desktop
- manter sidebar fixa lateral
- priorizar tabelas complexas como principal forma de visualização
- concentrar muitos formulários longos em uma única tela
- reproduzir exatamente a organização visual desktop sem adaptação

---

*Documento complementar ao SRS principal, com foco específico em requisitos de interface, navegação e experiência da versão web mobile.*
