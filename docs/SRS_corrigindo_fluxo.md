SRS_corrigindo_fluxo

========================================
REGRAS DE MOVIMENTAÇÃO DE ESTOQUE
========================================

1. Entidades obrigatórias

Para funcionamento do estoque, devem existir previamente:

- Produto cadastrado
- Fornecedor cadastrado
- Local de estoque (galpão/armazém) cadastrado


----------------------------------------
2. Cadastro de locais (galpões/armazéns)
----------------------------------------

O sistema deve permitir:

- Cadastro de múltiplos locais de estoque
- Cada local representa:
  - galpão
  - armazém
  - depósito
  - filial

Campos mínimos:

- nome
- descrição
- status (ativo/inativo)


----------------------------------------
3. Fluxo de entrada (compra)
----------------------------------------

Regra:

Uma entrada de estoque por compra deve conter:

- Produto (já cadastrado)
- Fornecedor
- Quantidade
- Local de destino (galpão/armazém)
- Custo unitário


Fluxo:

1. Selecionar fornecedor
2. Selecionar produto já existente
3. Informar quantidade
4. Selecionar local de armazenamento
5. Confirmar entrada


Restrições:

- Não permitir entrada sem fornecedor (exceto ajuste manual)
- Não permitir entrada sem local definido
- Produto deve existir previamente


----------------------------------------
4. Fluxo de saída (venda)
----------------------------------------

Regra:

Uma saída de estoque deve conter:

- Produto
- Local de origem
- Quantidade
- Destino (cliente)


Restrições:

- Não permitir saída sem saldo suficiente
- Não permitir saída sem local definido


----------------------------------------
5. Transferência entre armazéns
----------------------------------------

Regra:

Transferências devem conter:

- Produto
- Local de origem
- Local de destino
- Quantidade


Restrições:

- Origem e destino não podem ser iguais
- Deve haver saldo suficiente no local de origem


----------------------------------------
6. Ajustes de estoque
----------------------------------------

Permitir ajustes para:

- correção de erro
- perda
- inventário

Regra:

- Ajustes podem não ter fornecedor
- Devem conter:
  - motivo
  - usuário
  - data


----------------------------------------
7. Rastreabilidade
----------------------------------------

Toda movimentação deve registrar:

- tipo (entrada, saída, transferência, ajuste)
- produto
- origem
- destino
- usuário
- data/hora
- motivo


========================================
REGRAS DE FORNECEDORES
========================================

1. Cadastro

Fornecedor deve possuir:

- razão social
- CNPJ ou CPF
- contato
- status (ativo/inativo)


----------------------------------------
2. Relação com produtos
----------------------------------------

- Um produto pode ter:
  - 1 fornecedor principal
  - múltiplos fornecedores secundários (opcional)


----------------------------------------
3. Regras de compra
----------------------------------------

- Toda compra deve estar vinculada a um fornecedor
- O fornecedor deve estar ativo

Deve ser possível consultar:

- histórico de compras por fornecedor
- produtos fornecidos por fornecedor


----------------------------------------
4. Integração com estoque
----------------------------------------

- Entrada de estoque por compra deve sempre ter fornecedor
- Ajustes não exigem fornecedor


----------------------------------------
5. Integração com financeiro
----------------------------------------

- Compras podem gerar:
  - contas a pagar
  - controle de custo de produto


----------------------------------------
6. Restrições
----------------------------------------

- Não permitir compras com fornecedor inativo
- Não permitir exclusão de fornecedor com histórico
