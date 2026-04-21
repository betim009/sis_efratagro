# dados_mocados_produtos.md

## Visao geral

Este documento consolida **30 produtos mocados** para testes do modulo de produtos do ERP, alinhados ao SRS e ao schema real da tabela `produtos` em PostgreSQL.

Premissas aplicadas:

- `preco_venda` sempre maior que `preco_custo`
- `ponto_reposicao` sempre maior ou igual a `estoque_minimo`
- predominancia de produtos `ATIVO`, com alguns `INATIVO`
- codigos, codigos de barras e referencias internas sem repeticao
- pesos coerentes com o tipo comercial do item
- fornecedores padrao distribuidos entre multiplos fornecedores mockados
- IDs explicitos para facilitar uso em `seeders.sql`, testes de backend e fixtures de frontend

## Fornecedores mockados de referencia

Os produtos abaixo usam os seguintes fornecedores padrao. Se desejar inserir no banco exatamente como estao aqui, garanta que esses IDs existam na tabela `fornecedores`.

| fornecedor_padrao_id | fornecedor_mock |
|---|---|
| `f1000000-0000-0000-0000-000000000001` | Distribuidora Bom Preco Alimentos LTDA |
| `f1000000-0000-0000-0000-000000000002` | Central de Bebidas Centro-Oeste LTDA |
| `f1000000-0000-0000-0000-000000000003` | Casa da Limpeza Atacado LTDA |
| `f1000000-0000-0000-0000-000000000004` | Higiene Forte Distribuicao LTDA |
| `f1000000-0000-0000-0000-000000000005` | Papelaria e Utilidades Brasil LTDA |
| `f1000000-0000-0000-0000-000000000006` | Hortifruti Serra Verde Distribuidora LTDA |

## Regra aplicada para estoque

Foi adotado o criterio `ponto_reposicao >= estoque_minimo`, porque o ponto de reposicao representa o nivel em que o sistema deve sinalizar ou acionar compra antes de o item atingir o minimo operacional.

## Tabela legivel

| id | codigo | nome | categoria | un | custo | venda | peso_kg | cod_barras | referencia_interna | fornecedor_padrao_id | estoque_minimo | ponto_reposicao | status |
|---|---|---|---|---|---:|---:|---:|---|---|---|---:|---:|---|
| `20000000-0000-0000-0000-000000000001` | `ALI-0001` | Arroz Branco Tipo 1 5kg Bom Grao | Alimentos | FD | 19.80 | 27.90 | 5.000 | 7898300010011 | ALI-ARROZ-5KG-BG | `f1000000-0000-0000-0000-000000000001` | 20 | 35 | ATIVO |
| `20000000-0000-0000-0000-000000000002` | `ALI-0002` | Feijao Carioca Tipo 1 1kg Terra Boa | Alimentos | FD | 6.40 | 8.99 | 1.000 | 7898300010028 | ALI-FEIJAO-1KG-TB | `f1000000-0000-0000-0000-000000000001` | 40 | 70 | ATIVO |
| `20000000-0000-0000-0000-000000000003` | `ALI-0003` | Acucar Cristal 5kg Doce Vida | Alimentos | FD | 16.30 | 22.50 | 5.000 | 7898300010035 | ALI-ACUCAR-5KG-DV | `f1000000-0000-0000-0000-000000000001` | 18 | 30 | ATIVO |
| `20000000-0000-0000-0000-000000000004` | `ALI-0004` | Oleo de Soja 900ml Campo Nobre | Alimentos | CX | 6.10 | 8.49 | 0.900 | 7898300010042 | ALI-OLEO-900ML-CN | `f1000000-0000-0000-0000-000000000001` | 24 | 48 | ATIVO |
| `20000000-0000-0000-0000-000000000005` | `ALI-0005` | Macarrao Espaguete 500g Massa Leve | Alimentos | CX | 2.35 | 3.79 | 0.500 | 7898300010059 | ALI-MACARRAO-500G-ML | `f1000000-0000-0000-0000-000000000001` | 50 | 90 | ATIVO |
| `20000000-0000-0000-0000-000000000006` | `ALI-0006` | Farinha de Trigo Especial 5kg Dona Clara | Alimentos | FD | 17.20 | 24.40 | 5.000 | 7898300010066 | ALI-FARINHA-5KG-DC | `f1000000-0000-0000-0000-000000000001` | 16 | 28 | ATIVO |
| `20000000-0000-0000-0000-000000000007` | `BEB-0001` | Cafe Torrado e Moido 500g Serra Alta | Bebidas | CX | 11.80 | 16.90 | 0.500 | 7898300010073 | BEB-CAFE-500G-SA | `f1000000-0000-0000-0000-000000000002` | 22 | 40 | ATIVO |
| `20000000-0000-0000-0000-000000000008` | `BEB-0002` | Refrigerante Cola 2L Refresca+ | Bebidas | FD | 6.30 | 8.99 | 2.100 | 7898300010080 | BEB-REFRI-COLA-2L | `f1000000-0000-0000-0000-000000000002` | 30 | 54 | ATIVO |
| `20000000-0000-0000-0000-000000000009` | `BEB-0003` | Agua Mineral sem Gas 500ml Fonte Pura | Bebidas | FD | 1.05 | 1.89 | 0.500 | 7898300010097 | BEB-AGUA-500ML-FP | `f1000000-0000-0000-0000-000000000002` | 96 | 144 | ATIVO |
| `20000000-0000-0000-0000-000000000010` | `BEB-0004` | Suco de Uva Integral 1L Vale Roxo | Bebidas | CX | 7.80 | 11.90 | 1.000 | 7898300010103 | BEB-SUCO-UVA-1L-VR | `f1000000-0000-0000-0000-000000000002` | 20 | 36 | ATIVO |
| `20000000-0000-0000-0000-000000000011` | `BEB-0005` | Leite UHT Integral 1L Campo Vivo | Bebidas | CX | 4.55 | 6.79 | 1.000 | 7898300010110 | BEB-LEITE-1L-CV | `f1000000-0000-0000-0000-000000000002` | 36 | 60 | ATIVO |
| `20000000-0000-0000-0000-000000000012` | `BEB-0006` | Energético 269ml Turbo Max | Bebidas | CX | 4.20 | 6.99 | 0.269 | 7898300010127 | BEB-ENERG-269ML-TM | `f1000000-0000-0000-0000-000000000002` | 24 | 48 | INATIVO |
| `20000000-0000-0000-0000-000000000013` | `LIM-0001` | Agua Sanitaria 2L Brilho Lar | Limpeza | CX | 3.10 | 4.99 | 2.000 | 7898300010134 | LIM-AGUA-SANIT-2L | `f1000000-0000-0000-0000-000000000003` | 24 | 48 | ATIVO |
| `20000000-0000-0000-0000-000000000014` | `LIM-0002` | Detergente Neutro 500ml Lava Bem | Limpeza | CX | 1.35 | 2.39 | 0.500 | 7898300010141 | LIM-DETERG-500ML-LB | `f1000000-0000-0000-0000-000000000003` | 60 | 96 | ATIVO |
| `20000000-0000-0000-0000-000000000015` | `LIM-0003` | Sabao em Po 800g Roupa Limpa | Limpeza | CX | 5.60 | 8.49 | 0.800 | 7898300010158 | LIM-SABAO-PO-800G-RL | `f1000000-0000-0000-0000-000000000003` | 30 | 50 | ATIVO |
| `20000000-0000-0000-0000-000000000016` | `LIM-0004` | Desinfetante Lavanda 2L Casa Fresh | Limpeza | CX | 4.45 | 6.99 | 2.000 | 7898300010165 | LIM-DESINF-2L-CF | `f1000000-0000-0000-0000-000000000003` | 24 | 42 | ATIVO |
| `20000000-0000-0000-0000-000000000017` | `LIM-0005` | Limpador Multiuso 500ml Max Clean | Limpeza | CX | 3.90 | 6.20 | 0.500 | 7898300010172 | LIM-MULTIUSO-500ML | `f1000000-0000-0000-0000-000000000003` | 18 | 36 | ATIVO |
| `20000000-0000-0000-0000-000000000018` | `LIM-0006` | Esponja Dupla Face c/4 UltraSponge | Limpeza | FD | 2.10 | 3.79 | 0.060 | 7898300010189 | LIM-ESPONJA-C4-US | `f1000000-0000-0000-0000-000000000003` | 40 | 70 | INATIVO |
| `20000000-0000-0000-0000-000000000019` | `HIG-0001` | Papel Higienico Folha Dupla 12 rolos SoftConfort | Higiene | FD | 12.90 | 18.99 | 0.900 | 7898300010196 | HIG-PAPEL-12RL-SC | `f1000000-0000-0000-0000-000000000004` | 20 | 36 | ATIVO |
| `20000000-0000-0000-0000-000000000020` | `HIG-0002` | Sabonete 85g Erva Doce Puro Banho | Higiene | CX | 1.45 | 2.59 | 0.085 | 7898300010202 | HIG-SABONETE-85G-PB | `f1000000-0000-0000-0000-000000000004` | 72 | 120 | ATIVO |
| `20000000-0000-0000-0000-000000000021` | `HIG-0003` | Shampoo Hidratacao 350ml VitaHair | Higiene | CX | 8.70 | 13.90 | 0.350 | 7898300010219 | HIG-SHAMPOO-350ML-VH | `f1000000-0000-0000-0000-000000000004` | 18 | 30 | ATIVO |
| `20000000-0000-0000-0000-000000000022` | `HIG-0004` | Creme Dental Tripla Acao 90g Sorriso+ | Higiene | CX | 2.80 | 4.79 | 0.090 | 7898300010226 | HIG-CREME-90G-SP | `f1000000-0000-0000-0000-000000000004` | 36 | 72 | ATIVO |
| `20000000-0000-0000-0000-000000000023` | `HIG-0005` | Fralda Descartavel G c/32 BabyPrime | Higiene | FD | 22.40 | 32.90 | 1.100 | 7898300010233 | HIG-FRALDA-G32-BP | `f1000000-0000-0000-0000-000000000004` | 12 | 24 | ATIVO |
| `20000000-0000-0000-0000-000000000024` | `HIG-0006` | Alcool em Gel 70% 500ml Protege+ | Higiene | CX | 5.90 | 8.99 | 0.500 | 7898300010240 | HIG-ALCOOLGEL-500 | `f1000000-0000-0000-0000-000000000004` | 20 | 40 | INATIVO |
| `20000000-0000-0000-0000-000000000025` | `PAP-0001` | Caderno Universitario 10 materias Capa Dura NoteMax | Papelaria | UN | 12.50 | 18.90 | 0.750 | 7898300010257 | PAP-CADERNO-10M-NM | `f1000000-0000-0000-0000-000000000005` | 15 | 25 | ATIVO |
| `20000000-0000-0000-0000-000000000026` | `PAP-0002` | Papel Sulfite A4 500 folhas Branco Print | Papelaria | CX | 21.80 | 31.50 | 2.500 | 7898300010264 | PAP-SULFITE-A4-BP | `f1000000-0000-0000-0000-000000000005` | 20 | 32 | ATIVO |
| `20000000-0000-0000-0000-000000000027` | `PAP-0003` | Caneta Esferografica Azul c/50 Escrita Fina | Papelaria | CX | 18.90 | 27.90 | 0.450 | 7898300010271 | PAP-CANETA-AZ50-EF | `f1000000-0000-0000-0000-000000000005` | 10 | 20 | ATIVO |
| `20000000-0000-0000-0000-000000000028` | `UTE-0001` | Copo Descartavel 200ml c/100 Transparente Mix | Utilidades | CX | 4.30 | 6.79 | 0.380 | 7898300010288 | UTE-COPO-200-100-TM | `f1000000-0000-0000-0000-000000000005` | 48 | 80 | ATIVO |
| `20000000-0000-0000-0000-000000000029` | `HOR-0001` | Batata Lavada 1kg Selecionada | Hortifruti | KG | 3.60 | 5.49 | 1.000 | 7898300010295 | HOR-BATATA-1KG-SL | `f1000000-0000-0000-0000-000000000006` | 25 | 40 | ATIVO |
| `20000000-0000-0000-0000-000000000030` | `HOR-0002` | Cebola Amarela 1kg Selecionada | Hortifruti | KG | 3.20 | 4.99 | 1.000 | 7898300010301 | HOR-CEBOLA-1KG-SL | `f1000000-0000-0000-0000-000000000006` | 25 | 42 | ATIVO |

## Lista de produtos mocados

Cada item abaixo contem os campos obrigatorios do pedido e um `id` adicional para seed deterministico.

```json
[
  {"id":"20000000-0000-0000-0000-000000000001","codigo":"ALI-0001","nome":"Arroz Branco Tipo 1 5kg Bom Grao","descricao":"Arroz branco tipo 1 empacotado em fardo para distribuicao varejista.","unidade_medida":"FD","categoria":"Alimentos","preco_custo":19.80,"preco_venda":27.90,"peso":5.000,"codigo_barras":"7898300010011","referencia_interna":"ALI-ARROZ-5KG-BG","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000001","estoque_minimo":20,"ponto_reposicao":35,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000002","codigo":"ALI-0002","nome":"Feijao Carioca Tipo 1 1kg Terra Boa","descricao":"Feijao carioca tipo 1 para giro alto em mercearia.","unidade_medida":"FD","categoria":"Alimentos","preco_custo":6.40,"preco_venda":8.99,"peso":1.000,"codigo_barras":"7898300010028","referencia_interna":"ALI-FEIJAO-1KG-TB","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000001","estoque_minimo":40,"ponto_reposicao":70,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000003","codigo":"ALI-0003","nome":"Acucar Cristal 5kg Doce Vida","descricao":"Acucar cristal 5kg para atacado e varejo alimentar.","unidade_medida":"FD","categoria":"Alimentos","preco_custo":16.30,"preco_venda":22.50,"peso":5.000,"codigo_barras":"7898300010035","referencia_interna":"ALI-ACUCAR-5KG-DV","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000001","estoque_minimo":18,"ponto_reposicao":30,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000004","codigo":"ALI-0004","nome":"Oleo de Soja 900ml Campo Nobre","descricao":"Oleo de soja refinado em caixa fechada para canais varejistas.","unidade_medida":"CX","categoria":"Alimentos","preco_custo":6.10,"preco_venda":8.49,"peso":0.900,"codigo_barras":"7898300010042","referencia_interna":"ALI-OLEO-900ML-CN","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000001","estoque_minimo":24,"ponto_reposicao":48,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000005","codigo":"ALI-0005","nome":"Macarrao Espaguete 500g Massa Leve","descricao":"Macarrao seco tipo espaguete para cesta basica e varejo.","unidade_medida":"CX","categoria":"Alimentos","preco_custo":2.35,"preco_venda":3.79,"peso":0.500,"codigo_barras":"7898300010059","referencia_interna":"ALI-MACARRAO-500G-ML","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000001","estoque_minimo":50,"ponto_reposicao":90,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000006","codigo":"ALI-0006","nome":"Farinha de Trigo Especial 5kg Dona Clara","descricao":"Farinha de trigo especial de alto giro para padarias e mercados.","unidade_medida":"FD","categoria":"Alimentos","preco_custo":17.20,"preco_venda":24.40,"peso":5.000,"codigo_barras":"7898300010066","referencia_interna":"ALI-FARINHA-5KG-DC","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000001","estoque_minimo":16,"ponto_reposicao":28,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000007","codigo":"BEB-0001","nome":"Cafe Torrado e Moido 500g Serra Alta","descricao":"Cafe torrado e moido premium para supermercados e conveniencias.","unidade_medida":"CX","categoria":"Bebidas","preco_custo":11.80,"preco_venda":16.90,"peso":0.500,"codigo_barras":"7898300010073","referencia_interna":"BEB-CAFE-500G-SA","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000002","estoque_minimo":22,"ponto_reposicao":40,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000008","codigo":"BEB-0002","nome":"Refrigerante Cola 2L Refresca+","descricao":"Refrigerante sabor cola em fardo para reposicao de gondola.","unidade_medida":"FD","categoria":"Bebidas","preco_custo":6.30,"preco_venda":8.99,"peso":2.100,"codigo_barras":"7898300010080","referencia_interna":"BEB-REFRI-COLA-2L","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000002","estoque_minimo":30,"ponto_reposicao":54,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000009","codigo":"BEB-0003","nome":"Agua Mineral sem Gas 500ml Fonte Pura","descricao":"Agua mineral sem gas para vendas unitarias e atacado.","unidade_medida":"FD","categoria":"Bebidas","preco_custo":1.05,"preco_venda":1.89,"peso":0.500,"codigo_barras":"7898300010097","referencia_interna":"BEB-AGUA-500ML-FP","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000002","estoque_minimo":96,"ponto_reposicao":144,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000010","codigo":"BEB-0004","nome":"Suco de Uva Integral 1L Vale Roxo","descricao":"Suco integral sem adicao de acucar para linha premium.","unidade_medida":"CX","categoria":"Bebidas","preco_custo":7.80,"preco_venda":11.90,"peso":1.000,"codigo_barras":"7898300010103","referencia_interna":"BEB-SUCO-UVA-1L-VR","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000002","estoque_minimo":20,"ponto_reposicao":36,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000011","codigo":"BEB-0005","nome":"Leite UHT Integral 1L Campo Vivo","descricao":"Leite longa vida integral para distribuicao de alto giro.","unidade_medida":"CX","categoria":"Bebidas","preco_custo":4.55,"preco_venda":6.79,"peso":1.000,"codigo_barras":"7898300010110","referencia_interna":"BEB-LEITE-1L-CV","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000002","estoque_minimo":36,"ponto_reposicao":60,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000012","codigo":"BEB-0006","nome":"Energético 269ml Turbo Max","descricao":"Energetico em lata para conveniencia e checkout.","unidade_medida":"CX","categoria":"Bebidas","preco_custo":4.20,"preco_venda":6.99,"peso":0.269,"codigo_barras":"7898300010127","referencia_interna":"BEB-ENERG-269ML-TM","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000002","estoque_minimo":24,"ponto_reposicao":48,"status":"INATIVO"},
  {"id":"20000000-0000-0000-0000-000000000013","codigo":"LIM-0001","nome":"Agua Sanitaria 2L Brilho Lar","descricao":"Agua sanitaria para limpeza pesada domestica e institucional.","unidade_medida":"CX","categoria":"Limpeza","preco_custo":3.10,"preco_venda":4.99,"peso":2.000,"codigo_barras":"7898300010134","referencia_interna":"LIM-AGUA-SANIT-2L","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000003","estoque_minimo":24,"ponto_reposicao":48,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000014","codigo":"LIM-0002","nome":"Detergente Neutro 500ml Lava Bem","descricao":"Detergente neutro de alto giro para mercearia e atacarejo.","unidade_medida":"CX","categoria":"Limpeza","preco_custo":1.35,"preco_venda":2.39,"peso":0.500,"codigo_barras":"7898300010141","referencia_interna":"LIM-DETERG-500ML-LB","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000003","estoque_minimo":60,"ponto_reposicao":96,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000015","codigo":"LIM-0003","nome":"Sabao em Po 800g Roupa Limpa","descricao":"Sabao em po para limpeza domestica com boa margem no varejo.","unidade_medida":"CX","categoria":"Limpeza","preco_custo":5.60,"preco_venda":8.49,"peso":0.800,"codigo_barras":"7898300010158","referencia_interna":"LIM-SABAO-PO-800G-RL","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000003","estoque_minimo":30,"ponto_reposicao":50,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000016","codigo":"LIM-0004","nome":"Desinfetante Lavanda 2L Casa Fresh","descricao":"Desinfetante perfumado em embalagem economica.","unidade_medida":"CX","categoria":"Limpeza","preco_custo":4.45,"preco_venda":6.99,"peso":2.000,"codigo_barras":"7898300010165","referencia_interna":"LIM-DESINF-2L-CF","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000003","estoque_minimo":24,"ponto_reposicao":42,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000017","codigo":"LIM-0005","nome":"Limpador Multiuso 500ml Max Clean","descricao":"Limpador multiuso para diversas superficies com boa rotatividade.","unidade_medida":"CX","categoria":"Limpeza","preco_custo":3.90,"preco_venda":6.20,"peso":0.500,"codigo_barras":"7898300010172","referencia_interna":"LIM-MULTIUSO-500ML","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000003","estoque_minimo":18,"ponto_reposicao":36,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000018","codigo":"LIM-0006","nome":"Esponja Dupla Face c/4 UltraSponge","descricao":"Pacote com quatro esponjas para limpeza domestica.","unidade_medida":"FD","categoria":"Limpeza","preco_custo":2.10,"preco_venda":3.79,"peso":0.060,"codigo_barras":"7898300010189","referencia_interna":"LIM-ESPONJA-C4-US","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000003","estoque_minimo":40,"ponto_reposicao":70,"status":"INATIVO"},
  {"id":"20000000-0000-0000-0000-000000000019","codigo":"HIG-0001","nome":"Papel Higienico Folha Dupla 12 rolos SoftConfort","descricao":"Pacote com 12 rolos para autosservico e distribuicao.","unidade_medida":"FD","categoria":"Higiene","preco_custo":12.90,"preco_venda":18.99,"peso":0.900,"codigo_barras":"7898300010196","referencia_interna":"HIG-PAPEL-12RL-SC","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000004","estoque_minimo":20,"ponto_reposicao":36,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000020","codigo":"HIG-0002","nome":"Sabonete 85g Erva Doce Puro Banho","descricao":"Sabonete em barra de alto giro para higiene pessoal.","unidade_medida":"CX","categoria":"Higiene","preco_custo":1.45,"preco_venda":2.59,"peso":0.085,"codigo_barras":"7898300010202","referencia_interna":"HIG-SABONETE-85G-PB","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000004","estoque_minimo":72,"ponto_reposicao":120,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000021","codigo":"HIG-0003","nome":"Shampoo Hidratacao 350ml VitaHair","descricao":"Shampoo hidratante para linha de higiene com valor agregado.","unidade_medida":"CX","categoria":"Higiene","preco_custo":8.70,"preco_venda":13.90,"peso":0.350,"codigo_barras":"7898300010219","referencia_interna":"HIG-SHAMPOO-350ML-VH","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000004","estoque_minimo":18,"ponto_reposicao":30,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000022","codigo":"HIG-0004","nome":"Creme Dental Tripla Acao 90g Sorriso+","descricao":"Creme dental para mix basico de higiene pessoal.","unidade_medida":"CX","categoria":"Higiene","preco_custo":2.80,"preco_venda":4.79,"peso":0.090,"codigo_barras":"7898300010226","referencia_interna":"HIG-CREME-90G-SP","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000004","estoque_minimo":36,"ponto_reposicao":72,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000023","codigo":"HIG-0005","nome":"Fralda Descartavel G c/32 BabyPrime","descricao":"Fralda descartavel tamanho G para varejo e farmacias.","unidade_medida":"FD","categoria":"Higiene","preco_custo":22.40,"preco_venda":32.90,"peso":1.100,"codigo_barras":"7898300010233","referencia_interna":"HIG-FRALDA-G32-BP","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000004","estoque_minimo":12,"ponto_reposicao":24,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000024","codigo":"HIG-0006","nome":"Alcool em Gel 70% 500ml Protege+","descricao":"Alcool em gel para higiene das maos em embalagem de 500ml.","unidade_medida":"CX","categoria":"Higiene","preco_custo":5.90,"preco_venda":8.99,"peso":0.500,"codigo_barras":"7898300010240","referencia_interna":"HIG-ALCOOLGEL-500","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000004","estoque_minimo":20,"ponto_reposicao":40,"status":"INATIVO"},
  {"id":"20000000-0000-0000-0000-000000000025","codigo":"PAP-0001","nome":"Caderno Universitario 10 materias Capa Dura NoteMax","descricao":"Caderno universitario para campanha escolar e varejo geral.","unidade_medida":"UN","categoria":"Papelaria","preco_custo":12.50,"preco_venda":18.90,"peso":0.750,"codigo_barras":"7898300010257","referencia_interna":"PAP-CADERNO-10M-NM","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000005","estoque_minimo":15,"ponto_reposicao":25,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000026","codigo":"PAP-0002","nome":"Papel Sulfite A4 500 folhas Branco Print","descricao":"Resma A4 para escritorio, papelaria e uso corporativo.","unidade_medida":"CX","categoria":"Papelaria","preco_custo":21.80,"preco_venda":31.50,"peso":2.500,"codigo_barras":"7898300010264","referencia_interna":"PAP-SULFITE-A4-BP","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000005","estoque_minimo":20,"ponto_reposicao":32,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000027","codigo":"PAP-0003","nome":"Caneta Esferografica Azul c/50 Escrita Fina","descricao":"Caixa com 50 canetas para venda corporativa e escolar.","unidade_medida":"CX","categoria":"Papelaria","preco_custo":18.90,"preco_venda":27.90,"peso":0.450,"codigo_barras":"7898300010271","referencia_interna":"PAP-CANETA-AZ50-EF","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000005","estoque_minimo":10,"ponto_reposicao":20,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000028","codigo":"UTE-0001","nome":"Copo Descartavel 200ml c/100 Transparente Mix","descricao":"Pacote de copos descartaveis para utilidades e food service.","unidade_medida":"CX","categoria":"Utilidades","preco_custo":4.30,"preco_venda":6.79,"peso":0.380,"codigo_barras":"7898300010288","referencia_interna":"UTE-COPO-200-100-TM","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000005","estoque_minimo":48,"ponto_reposicao":80,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000029","codigo":"HOR-0001","nome":"Batata Lavada 1kg Selecionada","descricao":"Batata lavada padronizada para hortifruti e mercearia.","unidade_medida":"KG","categoria":"Hortifruti","preco_custo":3.60,"preco_venda":5.49,"peso":1.000,"codigo_barras":"7898300010295","referencia_interna":"HOR-BATATA-1KG-SL","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000006","estoque_minimo":25,"ponto_reposicao":40,"status":"ATIVO"},
  {"id":"20000000-0000-0000-0000-000000000030","codigo":"HOR-0002","nome":"Cebola Amarela 1kg Selecionada","descricao":"Cebola amarela selecionada com foco em distribuicao local.","unidade_medida":"KG","categoria":"Hortifruti","preco_custo":3.20,"preco_venda":4.99,"peso":1.000,"codigo_barras":"7898300010301","referencia_interna":"HOR-CEBOLA-1KG-SL","fornecedor_padrao_id":"f1000000-0000-0000-0000-000000000006","estoque_minimo":25,"ponto_reposicao":42,"status":"ATIVO"}
]
```

## Versao pronta para seeders.sql

Observacao: o schema real da tabela `produtos` usa a coluna `peso_kg` e possui tambem `permite_venda_sem_estoque`. Nesta massa mock, o valor foi fixado em `FALSE` para todos os itens.

```sql
INSERT INTO produtos (
  id, fornecedor_padrao_id, codigo, codigo_barras, referencia_interna, nome, descricao,
  unidade_medida, categoria, preco_custo, preco_venda, peso_kg, estoque_minimo,
  ponto_reposicao, permite_venda_sem_estoque, status
)
VALUES
  ('20000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','ALI-0001','7898300010011','ALI-ARROZ-5KG-BG','Arroz Branco Tipo 1 5kg Bom Grao','Arroz branco tipo 1 empacotado em fardo para distribuicao varejista.','FD','Alimentos',19.80,27.90,5.000,20,35,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000001','ALI-0002','7898300010028','ALI-FEIJAO-1KG-TB','Feijao Carioca Tipo 1 1kg Terra Boa','Feijao carioca tipo 1 para giro alto em mercearia.','FD','Alimentos',6.40,8.99,1.000,40,70,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000001','ALI-0003','7898300010035','ALI-ACUCAR-5KG-DV','Acucar Cristal 5kg Doce Vida','Acucar cristal 5kg para atacado e varejo alimentar.','FD','Alimentos',16.30,22.50,5.000,18,30,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000001','ALI-0004','7898300010042','ALI-OLEO-900ML-CN','Oleo de Soja 900ml Campo Nobre','Oleo de soja refinado em caixa fechada para canais varejistas.','CX','Alimentos',6.10,8.49,0.900,24,48,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000001','ALI-0005','7898300010059','ALI-MACARRAO-500G-ML','Macarrao Espaguete 500g Massa Leve','Macarrao seco tipo espaguete para cesta basica e varejo.','CX','Alimentos',2.35,3.79,0.500,50,90,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000006','f1000000-0000-0000-0000-000000000001','ALI-0006','7898300010066','ALI-FARINHA-5KG-DC','Farinha de Trigo Especial 5kg Dona Clara','Farinha de trigo especial de alto giro para padarias e mercados.','FD','Alimentos',17.20,24.40,5.000,16,28,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000007','f1000000-0000-0000-0000-000000000002','BEB-0001','7898300010073','BEB-CAFE-500G-SA','Cafe Torrado e Moido 500g Serra Alta','Cafe torrado e moido premium para supermercados e conveniencias.','CX','Bebidas',11.80,16.90,0.500,22,40,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000008','f1000000-0000-0000-0000-000000000002','BEB-0002','7898300010080','BEB-REFRI-COLA-2L','Refrigerante Cola 2L Refresca+','Refrigerante sabor cola em fardo para reposicao de gondola.','FD','Bebidas',6.30,8.99,2.100,30,54,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000009','f1000000-0000-0000-0000-000000000002','BEB-0003','7898300010097','BEB-AGUA-500ML-FP','Agua Mineral sem Gas 500ml Fonte Pura','Agua mineral sem gas para vendas unitarias e atacado.','FD','Bebidas',1.05,1.89,0.500,96,144,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000010','f1000000-0000-0000-0000-000000000002','BEB-0004','7898300010103','BEB-SUCO-UVA-1L-VR','Suco de Uva Integral 1L Vale Roxo','Suco integral sem adicao de acucar para linha premium.','CX','Bebidas',7.80,11.90,1.000,20,36,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000011','f1000000-0000-0000-0000-000000000002','BEB-0005','7898300010110','BEB-LEITE-1L-CV','Leite UHT Integral 1L Campo Vivo','Leite longa vida integral para distribuicao de alto giro.','CX','Bebidas',4.55,6.79,1.000,36,60,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000012','f1000000-0000-0000-0000-000000000002','BEB-0006','7898300010127','BEB-ENERG-269ML-TM','Energético 269ml Turbo Max','Energetico em lata para conveniencia e checkout.','CX','Bebidas',4.20,6.99,0.269,24,48,FALSE,'INATIVO'),
  ('20000000-0000-0000-0000-000000000013','f1000000-0000-0000-0000-000000000003','LIM-0001','7898300010134','LIM-AGUA-SANIT-2L','Agua Sanitaria 2L Brilho Lar','Agua sanitaria para limpeza pesada domestica e institucional.','CX','Limpeza',3.10,4.99,2.000,24,48,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000014','f1000000-0000-0000-0000-000000000003','LIM-0002','7898300010141','LIM-DETERG-500ML-LB','Detergente Neutro 500ml Lava Bem','Detergente neutro de alto giro para mercearia e atacarejo.','CX','Limpeza',1.35,2.39,0.500,60,96,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000015','f1000000-0000-0000-0000-000000000003','LIM-0003','7898300010158','LIM-SABAO-PO-800G-RL','Sabao em Po 800g Roupa Limpa','Sabao em po para limpeza domestica com boa margem no varejo.','CX','Limpeza',5.60,8.49,0.800,30,50,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000016','f1000000-0000-0000-0000-000000000003','LIM-0004','7898300010165','LIM-DESINF-2L-CF','Desinfetante Lavanda 2L Casa Fresh','Desinfetante perfumado em embalagem economica.','CX','Limpeza',4.45,6.99,2.000,24,42,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000017','f1000000-0000-0000-0000-000000000003','LIM-0005','7898300010172','LIM-MULTIUSO-500ML','Limpador Multiuso 500ml Max Clean','Limpador multiuso para diversas superficies com boa rotatividade.','CX','Limpeza',3.90,6.20,0.500,18,36,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000018','f1000000-0000-0000-0000-000000000003','LIM-0006','7898300010189','LIM-ESPONJA-C4-US','Esponja Dupla Face c/4 UltraSponge','Pacote com quatro esponjas para limpeza domestica.','FD','Limpeza',2.10,3.79,0.060,40,70,FALSE,'INATIVO'),
  ('20000000-0000-0000-0000-000000000019','f1000000-0000-0000-0000-000000000004','HIG-0001','7898300010196','HIG-PAPEL-12RL-SC','Papel Higienico Folha Dupla 12 rolos SoftConfort','Pacote com 12 rolos para autosservico e distribuicao.','FD','Higiene',12.90,18.99,0.900,20,36,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000020','f1000000-0000-0000-0000-000000000004','HIG-0002','7898300010202','HIG-SABONETE-85G-PB','Sabonete 85g Erva Doce Puro Banho','Sabonete em barra de alto giro para higiene pessoal.','CX','Higiene',1.45,2.59,0.085,72,120,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000021','f1000000-0000-0000-0000-000000000004','HIG-0003','7898300010219','HIG-SHAMPOO-350ML-VH','Shampoo Hidratacao 350ml VitaHair','Shampoo hidratante para linha de higiene com valor agregado.','CX','Higiene',8.70,13.90,0.350,18,30,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000022','f1000000-0000-0000-0000-000000000004','HIG-0004','7898300010226','HIG-CREME-90G-SP','Creme Dental Tripla Acao 90g Sorriso+','Creme dental para mix basico de higiene pessoal.','CX','Higiene',2.80,4.79,0.090,36,72,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000023','f1000000-0000-0000-0000-000000000004','HIG-0005','7898300010233','HIG-FRALDA-G32-BP','Fralda Descartavel G c/32 BabyPrime','Fralda descartavel tamanho G para varejo e farmacias.','FD','Higiene',22.40,32.90,1.100,12,24,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000024','f1000000-0000-0000-0000-000000000004','HIG-0006','7898300010240','HIG-ALCOOLGEL-500','Alcool em Gel 70% 500ml Protege+','Alcool em gel para higiene das maos em embalagem de 500ml.','CX','Higiene',5.90,8.99,0.500,20,40,FALSE,'INATIVO'),
  ('20000000-0000-0000-0000-000000000025','f1000000-0000-0000-0000-000000000005','PAP-0001','7898300010257','PAP-CADERNO-10M-NM','Caderno Universitario 10 materias Capa Dura NoteMax','Caderno universitario para campanha escolar e varejo geral.','UN','Papelaria',12.50,18.90,0.750,15,25,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000026','f1000000-0000-0000-0000-000000000005','PAP-0002','7898300010264','PAP-SULFITE-A4-BP','Papel Sulfite A4 500 folhas Branco Print','Resma A4 para escritorio, papelaria e uso corporativo.','CX','Papelaria',21.80,31.50,2.500,20,32,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000027','f1000000-0000-0000-0000-000000000005','PAP-0003','7898300010271','PAP-CANETA-AZ50-EF','Caneta Esferografica Azul c/50 Escrita Fina','Caixa com 50 canetas para venda corporativa e escolar.','CX','Papelaria',18.90,27.90,0.450,10,20,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000028','f1000000-0000-0000-0000-000000000005','UTE-0001','7898300010288','UTE-COPO-200-100-TM','Copo Descartavel 200ml c/100 Transparente Mix','Pacote de copos descartaveis para utilidades e food service.','CX','Utilidades',4.30,6.79,0.380,48,80,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000029','f1000000-0000-0000-0000-000000000006','HOR-0001','7898300010295','HOR-BATATA-1KG-SL','Batata Lavada 1kg Selecionada','Batata lavada padronizada para hortifruti e mercearia.','KG','Hortifruti',3.60,5.49,1.000,25,40,FALSE,'ATIVO'),
  ('20000000-0000-0000-0000-000000000030','f1000000-0000-0000-0000-000000000006','HOR-0002','7898300010301','HOR-CEBOLA-1KG-SL','Cebola Amarela 1kg Selecionada','Cebola amarela selecionada com foco em distribuicao local.','KG','Hortifruti',3.20,4.99,1.000,25,42,FALSE,'ATIVO')
ON CONFLICT (id) DO UPDATE
SET
  fornecedor_padrao_id = EXCLUDED.fornecedor_padrao_id,
  codigo = EXCLUDED.codigo,
  codigo_barras = EXCLUDED.codigo_barras,
  referencia_interna = EXCLUDED.referencia_interna,
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  unidade_medida = EXCLUDED.unidade_medida,
  categoria = EXCLUDED.categoria,
  preco_custo = EXCLUDED.preco_custo,
  preco_venda = EXCLUDED.preco_venda,
  peso_kg = EXCLUDED.peso_kg,
  estoque_minimo = EXCLUDED.estoque_minimo,
  ponto_reposicao = EXCLUDED.ponto_reposicao,
  permite_venda_sem_estoque = EXCLUDED.permite_venda_sem_estoque,
  status = EXCLUDED.status,
  atualizado_em = NOW();
```

## Consolidacao final

Resumo da massa:

- total de produtos: `30`
- ativos: `27`
- inativos: `3`
- categorias cobertas: `Alimentos`, `Bebidas`, `Limpeza`, `Higiene`, `Papelaria`, `Utilidades`, `Hortifruti`
- unidades utilizadas: `UN`, `KG`, `CX`, `FD`

Se desejar, o proximo passo natural e transformar esta massa em:

- bloco pronto para substituir o `INSERT INTO produtos` em `backend/src/database/seeders.sql`
- fixture JS para frontend
- factory para testes automatizados do backend
