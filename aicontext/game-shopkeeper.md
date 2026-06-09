# Game Shopkeeper

## Features

### Shopkeeper
`Shopkeeper` é o objeto Phaser que representa venda e acesso à loja. Ele se conecta ao `CharacterStore`, mostra feedback visual de hover e drag, renderiza label de venda e emite intenção para abrir a loja.

O shopkeeper escuta `sell-character-shopkeeper` via `EventBus` para vender personagens arrastados até sua área. No destroy, remove a subscription do EventBus e todos os listeners próprios.

### Store Integration
Venda de personagem é delegada para `CharacterStore`. O shopkeeper só reflete custo visual e intenção de interação; regra de economia permanece no sistema de loja e na cena.

## Fixes
