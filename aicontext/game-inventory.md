# Game Inventory

## Features

### ItemInventory
`ItemInventory` é o dono único dos itens que o jogador possui durante a run. Ele substitui a antiga coleção de itens soltos no board, então todo item recebido por loot, bigorna, venda, banco ou merge passa a ser guardado aqui em vez de aparecer aleatoriamente na arena.

A classe preserva a ordem de exibição dos itens e expõe uma superfície parecida com a de um `Set`: `add`, `delete`, `clear`, `has`, `values`, `forEach` e iteração. `add` é idempotente, guarda o item na bolsa escondendo o sprite (`Item.store`) e nunca duplica uma instância já presente.

`findById` localiza um item pelo seu identificador, `snapshot` devolve os itens agrupados por categoria para a interface, `reorder` move um item dentro da própria categoria e `serialize` devolve apenas as chaves dos itens permanentes na ordem atual.

### ItemInventoryLayout
`ItemInventoryLayout` concentra as regras puras da bolsa, sem dependência de Phaser ou da classe `Item`, para serem testáveis isoladamente. Ele define as categorias `artifact`, `completed` e `component`, a ordem canônica dos divisores, o agrupamento por categoria e a reordenação dentro de uma categoria.

A reordenação mantém a posição relativa dos itens de outras categorias e limita o destino a uma posição válida da categoria do item movido.

### Backpack UI
A interface React da bolsa (`Inventory`) mostra um botão com ícone próprio e a contagem de itens. Ao expandir, exibe os divisores estáveis, cada um com um grid de itens. A lista de itens é atualizada ouvindo o evento `inventory-change` emitido pela cena.

A consulta da bolsa é permitida também durante o combate, mas mover, equipar e reordenar só são permitidos no estado `idle`. O arraste usa eventos dedicados (`ui-item-drag-start`, `ui-item-drag-move` e `ui-item-drag-end`) para não se misturar com o arraste de personagens. Soltar um item sobre uma criatura válida equipa ou combina no sistema existente; soltar dentro do painel apenas reordena a categoria; soltar em qualquer outro lugar devolve o item à bolsa.

### Persistence
Os itens guardados são persistidos junto do progresso da run. O DTO `progress` mantém `availableItems` como a lista de chaves na ordem exibida na bolsa, preservando a ordem relativa ao recarregar. Saves antigos são reidratados diretamente na bolsa, sem espalhar itens na arena. Itens temporários de Thiefsgloves continuam fora da persistência permanente.
