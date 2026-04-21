# Mobile Frontend ERP

## 1. Estratégia Mobile

Foi adotada uma **arquitetura mobile separada por rotas** em vez de apenas esconder a sidebar do desktop. A razão é simples: o SRS mobile exige navegação inferior, ações rápidas flutuantes, conteúdo em coluna única, filtros temporários e substituição real de tabelas por blocos verticais.

Estratégia aplicada:

- Desktop continua em rotas atuais (`/dashboard`, `/clientes`, etc.)
- Mobile fica isolado em rotas próprias (`/m/dashboard`, `/m/vendas`, etc.)
- A rota raiz redireciona por breakpoint:
  - telas pequenas: `/m/dashboard`
  - telas maiores: `/dashboard`
- Serviços, autenticação e dialogs existentes foram reutilizados
- Layout, navegação, leitura visual e densidade de conteúdo foram redesenhados para mobile

## 2. Estrutura de Pastas

```txt
frontend/src/
  layouts/
    mobile/
      MobileLayout.jsx
  mobile/
    components/
      MobileActionBar.jsx
      MobileCard.jsx
      MobileFilterDrawer.jsx
      MobileListItem.jsx
      MobilePageShell.jsx
      MobileSection.jsx
      MobileStatCard.jsx
      MobileStateSection.jsx
    pages/
      DashboardMobilePage.jsx
      ClientesMobilePage.jsx
      ProdutosMobilePage.jsx
      EstoqueMobilePage.jsx
      VendasMobilePage.jsx
      FinanceiroMobilePage.jsx
      MenuMobilePage.jsx
    utils/
      formatters.js
```

## 3. Layout Mobile Principal

Arquivo principal: [MobileLayout.jsx](/Users/alberto/sis_efratagro/frontend/src/layouts/mobile/MobileLayout.jsx)

Aplicado conforme SRS:

- sem sidebar fixa
- `AppBar` superior compacta
- `BottomNavigation` fixa no rodapé
- `FAB` ou `SpeedDial` para ações rápidas
- área principal com scroll vertical natural
- fundo leve e blocos separados por cards

## 4. Navegação Mobile

Itens implementados na `BottomNavigation`:

- Dashboard
- Vendas
- Estoque
- Financeiro
- Menu

O item `Menu` concentra acessos complementares como:

- Clientes
- Produtos
- Atalho para versão desktop
- Logout

## 5. Páginas Mobile Implementadas

### Dashboard

Arquivo: [DashboardMobilePage.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/pages/DashboardMobilePage.jsx)

Adaptações:

- cards de KPI em bloco vertical
- resumo financeiro simplificado
- alertas em `Accordion`
- sem grid denso

Integração backend:

- `dashboardService.getResumo()`
- `dashboardService.getFinanceiro()`
- `dashboardService.getEstoque()`

### Clientes

Arquivo: [ClientesMobilePage.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/pages/ClientesMobilePage.jsx)

Adaptações:

- tabela substituída por `MobileListItem`
- filtro em `Drawer` inferior
- CTA principal para novo cliente
- ações por item com toque confortável

Integração backend:

- `clienteService.listar()`
- `clienteService.criar()`
- `clienteService.atualizar()`
- `clienteService.alterarStatus()`

### Produtos

Arquivo: [ProdutosMobilePage.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/pages/ProdutosMobilePage.jsx)

Adaptações:

- cards com preço, categoria e status
- destaque visual para estoque mínimo
- filtros não persistentes

### Estoque

Arquivo: [EstoqueMobilePage.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/pages/EstoqueMobilePage.jsx)

Adaptações:

- alternância entre saldos e movimentações por `Tabs`
- saldos e movimentações em cards
- alertas de baixo estoque no topo
- ações rápidas para entrada e transferência

### Vendas

Arquivo: [VendasMobilePage.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/pages/VendasMobilePage.jsx)

Adaptações:

- cards por venda
- CTA direto para nova venda
- cancelamento via ação por item
- filtros por tipo e status em drawer

### Financeiro

Arquivo: [FinanceiroMobilePage.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/pages/FinanceiroMobilePage.jsx)

Adaptações:

- resumo em `MobileStatCard`
- duplicatas em cards
- ação de pagamento direta no item
- filtro móvel por status

Integração backend:

- `financeiroService.listarDuplicatas()`
- `financeiroService.getResumo()`
- `financeiroService.registrarPagamento()`

## 6. Componentes Reutilizáveis Mobile

Arquivos:

- [MobileCard.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileCard.jsx)
- [MobileListItem.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileListItem.jsx)
- [MobileSection.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileSection.jsx)
- [MobileStatCard.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileStatCard.jsx)
- [MobileActionBar.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileActionBar.jsx)
- [MobileFilterDrawer.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileFilterDrawer.jsx)
- [MobileStateSection.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobileStateSection.jsx)
- [MobilePageShell.jsx](/Users/alberto/sis_efratagro/frontend/src/mobile/components/MobilePageShell.jsx)

Objetivo dos componentes:

- padronizar UI mobile
- reduzir repetição
- manter escalabilidade para novos módulos
- desacoplar experiência mobile do desktop

## 7. Estratégia de Substituição de Tabelas por Cards

No desktop, as telas usam `DataTable`. No mobile, isso foi substituído por `MobileListItem`, com:

- título principal
- subtítulo contextual
- valor/meta à direita
- chips de status
- bloco de detalhes resumidos
- ações com `IconButton`

Benefícios:

- leitura vertical
- menos rolagem horizontal
- melhor área de toque
- menor densidade visual

## 8. Estratégia de Filtros Mobile

Os filtros foram movidos para `MobileFilterDrawer`, aberto sob demanda.

Padrão aplicado:

- `Drawer` inferior
- busca principal no topo
- selects empilhados
- botão limpar
- botão aplicar

Isso segue o SRS mobile ao evitar filtros fixos ocupando a tela.

## 9. Responsividade vs Versão Separada

Foi escolhida **versão separada por rotas mobile**.

Justificativa:

- o SRS mobile altera navegação estrutural
- sidebar fixa e tabelas do desktop entram em conflito com o modelo mobile
- a manutenção fica mais clara quando layout e fluxo mobile têm sua própria camada
- ainda existe reaproveitamento de serviços, contexto de auth e dialogs

Portanto, a solução é híbrida:

- experiência desktop preservada
- experiência mobile separada e coerente
- compartilhamento de lógica de negócio

## 10. Rotas Mobile

Arquivo alterado: [AppRoutes.jsx](/Users/alberto/sis_efratagro/frontend/src/routes/AppRoutes.jsx)

Rotas adicionadas:

```txt
/m/dashboard
/m/clientes
/m/produtos
/m/estoque
/m/vendas
/m/financeiro
/m/menu
```

## 11. Estados de Interface

Tratamento incluído em todas as páginas mobile:

- loading: `MobileLoadingState` com `Skeleton`
- vazio: `MobileEmptyState`
- erro: `MobileErrorState`

Isso garante feedback consistente em redes móveis e uso em campo.

## 12. Boas Práticas Aplicadas

- coluna única como padrão
- sem sidebar lateral
- `BottomNavigation` como navegação principal
- `FAB` e `SpeedDial` para ação principal
- componentes com toque confortável
- conteúdo colapsável onde há maior densidade
- reaproveitamento de serviços já existentes
- separação limpa entre experiência desktop e mobile
- cards no lugar de tabelas pesadas
- filtros temporários em vez de áreas fixas

## 13. Arquivos Alterados

- [AppRoutes.jsx](/Users/alberto/sis_efratagro/frontend/src/routes/AppRoutes.jsx)
- [theme.js](/Users/alberto/sis_efratagro/frontend/src/styles/theme.js)
- [MobileLayout.jsx](/Users/alberto/sis_efratagro/frontend/src/layouts/mobile/MobileLayout.jsx)
- [mobile_frontend_erp.md](/Users/alberto/sis_efratagro/mobile_frontend_erp.md)
- toda a nova árvore `frontend/src/mobile`

## 14. Resultado

A implementação entregue cria uma camada mobile funcional, navegável e alinhada ao SRS Mobile, com:

- layout mobile completo
- navegação inferior funcional
- páginas principais adaptadas
- componentes reutilizáveis definidos
- filtros mobile
- estados de loading, vazio e erro
- exemplos reais de integração com backend
