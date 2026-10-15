# Game Inventory

## Features

### ItemInventory
`ItemInventory` é o dono único dos itens que o jogador possui durante a run. Ele substitui a antiga coleção de itens soltos no board, então todo item recebido por loot, bigorna, venda, banco ou merge passa a ser guardado aqui em vez de aparecer aleatoriamente na arena.

A classe preserva a ordem de exibição dos itens e expõe uma superfície parecida com a de um `Set`: `add`, `delete`, `clear`, `has`, `values`, `forEach` e iteração. `add` é idempotente, guarda o item na bolsa escondendo o sprite (`Item.store`) e nunca duplica uma instância já presente.

`findById` localiza um item pelo seu identificador, `snapshot` devolve os itens agrupados por categoria para a bolsa, `reorder` move um item dentro da própria categoria e `serialize` devolve apenas as chaves dos itens permanentes na ordem atual. Toda mudança emite `inventory-change`, que a bolsa Phaser escuta para se redesenhar.

### ItemInventoryLayout
`ItemInventoryLayout` concentra as regras puras de agrupamento e reordenação da bolsa, sem dependência de Phaser ou da classe `Item`, para serem testáveis isoladamente. Ele define as categorias `artifact`, `completed` e `component`, a ordem canônica dos divisores, o agrupamento por categoria e a reordenação dentro de uma categoria.

A reordenação mantém a posição relativa dos itens de outras categorias e limita o destino a uma posição válida da categoria do item movido.

### InventoryBagLayout
`InventoryBagLayout` concentra a geometria pura da bolsa, também livre de Phaser, cobrindo quatro responsabilidades: ancorar o ícone da bolsa no canto superior direito do mapa; posicionar o painel à esquerda do ícone, com o topo alinhado ao topo do ícone e limitado à área visível; calcular o grid a partir da quantidade de itens por categoria, respeitando os limites de colunas e de linhas visíveis e informando quanto do conteúdo precisa ser rolado; e derivar a geometria da scrollbar e o destino de um arraste.

O grid começa tão estreito quanto o conteúdo precisa e cresce até o limite de colunas. Um único valor de espaçamento separa colunas, linhas e categorias, então a distância entre linhas é exatamente a distância entre colunas em qualquer ponto do grid. Cada categoria ocupa um bloco contíguo de linhas, então um separador nunca corta uma linha no meio; o excedente de altura fica acessível por rolagem. As funções também mapeiam um ponto do conteúdo para a célula e para o índice dentro da categoria, usados pela reordenação.

### InventoryBag
`InventoryBag` desenha a bolsa inteiramente com objetos Phaser, sem nenhuma interface React: um sprite de bolsa, um contador e um painel com fundo, título, legenda de categorias, slots e scrollbar.
O ícone fica fixo no canto superior direito do mapa e não se move. O tamanho da âncora vem da constante de tamanho visual da bolsa, nunca do sprite, porque esse cálculo acontece antes de o sprite existir. Um clique abre ou fecha o painel, que é montado à esquerda do ícone, com o topo alinhado ao topo do ícone.

As categorias são identificadas por uma legenda compacta no cabeçalho, uma cor por categoria, e no grid por uma linha fina desenhada dentro do espaçamento normal entre linhas. Assim a separação entre categorias não aumenta a distância entre linhas, que continua idêntica à distância entre colunas.

O grid visível cresce com o conteúdo até o limite de colunas e de linhas; quando o conteúdo passa desse limite, a bolsa passa a ter rolagem vertical, acionada pela roda do mouse sobre a área do painel, pela scrollbar ou por arrastar o fundo do painel (toque). A área de conteúdo é recortada por máscara, e itens fora da janela ficam escondidos, sem hover e sem servirem de destino de drop.

Com a bolsa aberta, cada item guardado fica visível no seu slot usando a escala do slot. O painel tem prioridade sobre o board: enquanto o ponteiro está sobre a área do painel, criaturas e itens atrás dele não são considerados. Soltar um item sobre um slot da mesma categoria reordena; soltar sobre qualquer outro lugar devolve o item para a bolsa. Itens nunca ficam soltos no mapa.

A bolsa e os itens que ela mostra desenham acima das barras de vida das criaturas; um item arrastado sobe para a camada mais alta e volta para a camada correta ao terminar o gesto. Um arraste de item limpa o recorte enquanto dura, para poder alcançar personagens fora do painel.

Durante o combate apenas a consulta é permitida: o painel fecha ao entrar em `fighting`, impedindo reordenar ou equipar.

Todo objeto, listener global, máscara e estado transitório da bolsa é liberado em `dispose`, chamado pelo cleanup da cena.

### InventoryDepths
`InventoryDepths` centraliza a ordem de desenho compartilhada entre a bolsa e os itens (item equipado, ícone, contador, painel, slots e item em arraste), garantindo que o painel fique acima da UI das criaturas e que os itens apareçam acima do fundo do painel.

### Depósito de itens (animação de entrada na bolsa)
`ItemDeposit` é o contexto visual de toda transferência de item para a bolsa: `from` é o ponto do mundo de onde o item sai e `animate: false` força o armazenamento imediato. `depositOrigin` traduz esse contexto no ponto de origem (ou `undefined` quando o item deve ser guardado em silêncio) e `ItemInventory.add` recebe esse contexto.

Quando existe origem, `ItemInventory.add` emite `inventory-deposit` **antes** de atualizar os grupos, e a bolsa responde criando uma cópia transitória não interativa do item, que voa da origem até o ícone e some ao pousar. O sprite real do item permanece escondido durante o voo, então o item nunca aparece duas vezes e um segundo depósito do mesmo item é ignorado enquanto ele ainda voa.

As origens por fluxo:

- item arrastado e solto no mapa: ponto onde foi solto;
- desequipar pela ficha, venda, banco, fusão e equipamento recusado: posição do personagem;
- loot de Sorita: posição da criatura que gerou o item;
- recompensa de andar, bigorna e itens sem origem física: ponto visível de entrega na arena (com deslocamento quando vários itens chegam juntos).

São guardados sem animação: a reidratação do save (restaurar estado não é receber item), o componente consumido por uma fusão e o arraste solto diretamente sobre o ícone ou o painel da bolsa.

A cópia em voo fica acima de todas as outras camadas (`ITEM_FLY_DEPTH`), não recebe input e é destruída ao pousar. Reiniciar a run (`cancelFlights`) e o `dispose` da bolsa removem cópias e tweens pendentes.

### Persistence
Os itens guardados são persistidos junto do progresso da run. O DTO `progress` mantém `availableItems` como a lista de chaves na ordem exibida.

Saves antigos são reidratados diretamente na bolsa, sem espalhar itens na arena; chaves de posição de versões anteriores são ignoradas, já que o ícone agora é fixo no canto superior direito. Itens temporários de Thiefsgloves continuam fora da persistência permanente.
