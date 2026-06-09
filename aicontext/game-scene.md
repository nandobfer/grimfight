# Game Scene

## Features

### State And Round Lifecycle
A cena transita entre dois estados globais (`GameState`): `idle` e `fighting`. No estado `idle`, o jogador prepara a equipe e itens. `startRound` inicia o combate chamando reset nos times e alterando o estado para `fighting`. 
O término de um round utiliza `endRoundSoon`, que defere a resolução de vitória ou derrota para evitar inconsistências durante a iteração de update de atores.

### Floor Progression And Encounters
O jogo avança progressivamente através do `floor`. `onFloorDefeated` aplica as recompensas (ouro, vidas) baseadas no andar atual e invoca `buildFloor` para gerar o próximo encontro.
Os inimigos são populados a partir de `generateEncounter`. Adicionalmente, augments são oferecidos ao jogador a cada cinco andares (via `handleAugmentsFloor`) e itens especiais/bigornas a cada dez andares (`handleArtifactsFloor`). Inimigos também escalam recebendo augments periodicamente (`handleEnemiesAugments`).

### UI Drag Bridge
A integração entre o canvas do Phaser e as interfaces overlay React ocorre ouvindo intenções do `EventBus`.
Ao receber eventos como `ui-drag-start`, a cena gera uma representação visual (ghost) e ativa o modo de drop no grid. `ui-drag-end` confirma a ação engatilhando o encaixe no board ou vendendo o personagem/enviando ao bench caso seja dropado sobre áreas específicas (Shopkeeper ou Tavern).

### Persistence
O estado global da run (ouro, andar, vidas, augments ativos, itens disponíveis) é mantido sincronizado com `localStorage` através das funções `saveProgress` e `loadProgress`. O histórico de runs é registrado em `saveRecord`.

### Cleanup
Para suportar restart da cena ou recarregamentos limpos, a cena desregistra seus listeners de teclado e `EventBus` respondendo ao evento `Phaser.Scenes.Events.SHUTDOWN`.

## Fixes
