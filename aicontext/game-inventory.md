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
`InventoryBagLayout` concentra a geometria pura da bolsa, também livre de Phaser, cobrindo três responsabilidades: escolher um canto aleatório do mapa para o nascimento da bolsa e manter a bolsa inteira dentro da região; decidir de que lado do mapa o painel abre e limitá-lo à área visível; e paginar a lista de slots quando existem mais itens do que cabem na página.

### InventoryBag
`InventoryBag` desenha a bolsa inteiramente com objetos Phaser, sem nenhuma interface React: um sprite de bolsa, um contador e um painel com fundo, título, divisor por categoria e slots.

A bolsa nasce em um canto aleatório do mapa com uma animação curta de surgimento, igual ao antigo drop de itens, e pode ser arrastada pela arena durante o estado `idle`. A posição de nascimento, os limites de arraste e o clamp de uma posição salva são calculados a partir da constante de tamanho visual da bolsa, nunca do sprite, porque esse cálculo acontece antes de o sprite existir. Um arraste só começa depois de o ponteiro se mover o suficiente, então o mesmo gesto distingue clique (abre ou fecha o painel) de arraste (move a bolsa). A posição é persistida ao fim do arraste.

Com a bolsa aberta, cada item guardado fica visível no seu slot usando a escala do slot. A ordem de exibição vem das categorias do inventário, e o painel pagina automaticamente quando a categoria transborda.

O painel tem prioridade sobre o board: enquanto o ponteiro está sobre a área do painel, criaturas atrás dele não são destacadas nem equipadas. Soltar um item sobre um slot da mesma categoria reordena; soltar sobre qualquer outro lugar devolve o item para a bolsa. Itens nunca ficam soltos no mapa.

Durante o combate apenas a consulta é permitida: o painel fecha ao entrar em `fighting`, impedindo mover a bolsa, reordenar ou equipar.

Todo objeto, listener global e estado transitório da bolsa é liberado em `dispose`, chamado pelo cleanup da cena.

### Persistence
Os itens guardados e a posição da bolsa são persistidos junto do progresso da run. O DTO `progress` mantém `availableItems` como a lista de chaves na ordem exibida e `bagPosition` com o centro da bolsa na arena.

Saves antigos são reidratados diretamente na bolsa, sem espalhar itens na arena; quando não há posição salva, a bolsa nasce em um canto aleatório. Uma nova run sorteia um novo canto. Itens temporários de Thiefsgloves continuam fora da persistência permanente.
