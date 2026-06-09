# Game Tavern

## Features

### Tavern
`Tavern` é o objeto Phaser que representa armazenamento de personagens no bench. Ele se conecta ao `Bench`, mostra feedback visual de hover e drag, renderiza label de drop e emite intenção para abrir o bench.

A tavern escuta `bench-character-tavern` via `EventBus`, transforma o personagem em DTO, executa `onBenchDrop` e adiciona o DTO ao bench. No destroy, remove a subscription do EventBus e todos os listeners próprios.

### Bench Integration
O fluxo da tavern move personagens do board para o bench apenas em resposta a intenção de drag/drop. Persistência e merge de bench permanecem no sistema `Bench`.

## Fixes
