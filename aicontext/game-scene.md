# Game Scene

## Features

### Application Entry Flow
O app React inicia na tela de menu principal. Quando o jogador escolhe nova run ou continuar uma run salva, o app entra em estado de carregamento, mantém o menu principal visível e monta `PhaserGame` em segundo plano para carregar os assets. O progresso emitido pelo preloader via `load-progress` é exibido no próprio menu principal. A `Ui` também é montada durante o carregamento para escutar `game-ready`, mas o menu principal fica acima dela até `load-complete`.

Iniciar uma nova run limpa apenas as chaves locais da sessão atual, preservando o histórico de recordes.

O menu in-game pode emitir `quit-to-menu` pelo `EventBus`. Antes de sair, a cena salva o progresso atual e, quando está em `idle`, também persiste a composição atual do jogador. Ao voltar para o menu principal, o React desmonta a instância Phaser; ao continuar, uma nova instância é criada e a cena carrega o estado local existente.

Componentes de UI que precisam de estado da cena atual devem receber a instância ativa de `Game` em vez de solicitar dados por eventos globais genéricos. O `Recount`, por exemplo, inicializa o medidor diretamente pelo `DamageChart` da `playerTeam` atual para evitar que listeners de cenas destruídas respondam após sair e entrar novamente no jogo.

### State And Round Lifecycle
A cena transita entre dois estados globais (`GameState`): `idle` e `fighting`. No estado `idle`, o jogador prepara a equipe e itens. `startRound` inicia o combate chamando reset nos times e alterando o estado para `fighting`. 
O término de um round utiliza `endRoundSoon`, que defere a resolução de vitória ou derrota para evitar inconsistências durante a iteração de update de atores.

### Battle Time And Overtime
Cada batalha possui um tempo limite de combate ativo gerenciado por `BattleTimer`. A cena alimenta o cronometro apenas enquanto o estado e `fighting`; pausar o jogo ou entrar em `idle` interrompe a contagem.

Quando o tempo acaba, o combate continua, mas a cena aplica um multiplicador de velocidade maior via `setGameSpeed`, acelerando fisica, animacoes, tweens e timers para encurtar batalhas arrastadas. A cena nao encerra a batalha sozinha ao estourar o tempo.

A velocidade efetiva combina a velocidade manual de debug (`setManualGameSpeed`) com o multiplicador de overtime, de modo que a aceleracao automatica nunca sobrescreve a escolha manual. Ao encerrar a batalha, a cena captura se a vitoria aconteceu dentro do tempo antes de sair de `fighting`, volta a velocidade normal e reinicia o cronometro.

A leitura do cronometro e desenhada pela propria cena Phaser: o HUD acompanha o estado do `BattleTimer` e projeta o tempo restante ou o multiplicador de overtime em um texto, sem overlay React e sem emissao de eventos por segundo. O cronometro e um estado transitorio: nao entra na persistencia local.

O HUD e criado junto do controlador, atualizado durante o combate, ocultado fora dele e destruido no cleanup da cena. A cena nao recria o HUD a cada round.

### Fast Victory Reward
Vencer antes do tempo concede um bonus de ouro sobre a recompensa normal do floor. O calculo fica em helpers puros (`floorReward`), e `PlayerTeam.grantFloorReward` recebe se a vitoria foi rapida. Vidas extras de floors de boss, loot e a consolacao de derrota nao sao afetados pelo bonus.

Quando a cena carrega personagens do jogador e nao existe composicao salva, ela cria um personagem jogavel aleatorio diretamente no board pelo fluxo normal do `PlayerTeam`.

Durante a hidratacao de uma run salva, a cena bloqueia persistencia intermediaria. Personagens, niveis, posicoes e itens devem ser restaurados antes que qualquer efeito de equipamento ou reset possa regravar o save.

### Floor Progression And Encounters
O jogo avança progressivamente através do `floor`. `onFloorDefeated` aplica as recompensas (ouro, vidas) baseadas no andar atual e invoca `buildFloor` para gerar o próximo encontro.
Vitórias em andares de boss concedem vidas extras pela recompensa de floor, antes do avanço para o próximo encontro.
Os inimigos são populados a partir de `generateEncounter`. Adicionalmente, augments são oferecidos ao jogador a cada cinco andares (via `handleAugmentsFloor`) e itens especiais/bigornas a cada dez andares (`handleArtifactsFloor`). Inimigos também escalam recebendo augments periodicamente (`handleEnemiesAugments`).

Escolhas especiais de item concedidas por andar sao marcadas como reivindicadas no progresso local quando o jogador aceita o item. Ao continuar uma run, andares ja reivindicados nao reabrem a escolha.

O tamanho permitido do board do jogador nao progride pelo `floor`; a cena expoe esse valor como regra derivada do `PlayerTeam` atual.

### UI Drag Bridge
A integração entre o canvas do Phaser e as interfaces overlay React ocorre ouvindo intenções do `EventBus`.
Ao receber eventos como `ui-drag-start`, a cena gera uma representação visual (ghost) e ativa o modo de drop no grid. `ui-drag-end` confirma a ação engatilhando o encaixe no board ou vendendo o personagem/enviando ao bench caso seja dropado sobre áreas específicas (Shopkeeper ou Tavern).

A bolsa nao usa bridge de DOM: `InventoryBag` vive dentro da cena, nasce em um canto aleatorio do mapa, pode ser arrastada e abre um painel Phaser com divisores e slots. Arrastar um item do painel reaproveita o drag nativo do `Item` para equipar na criatura sob o ponteiro, e o painel tem prioridade sobre o board enquanto o ponteiro esta sobre ele.

### Persistence
O estado global da run (ouro, andar, vidas, augments ativos, itens disponíveis) é mantido sincronizado com `localStorage` através das funções `saveProgress` e `loadProgress`. O histórico de runs é registrado em `saveRecord`.

Itens temporarios ou efeitos de hidratacao nao fazem parte da persistencia permanente da run.

Os itens guardados pertencem a bolsa (`ItemInventory`) e sao persistidos por `progress.availableItems` como a lista de chaves na ordem exibida. O icone da bolsa e fixo no canto superior direito do mapa, sem posicao persistida; chaves de posicao de saves antigos sao ignoradas.

### Cleanup
Para suportar restart da cena ou recarregamentos limpos, a cena desregistra seus listeners de teclado e `EventBus` respondendo ao evento `Phaser.Scenes.Events.SHUTDOWN`.

Listeners globais do `EventBus` registrados pela cena devem passar por `disposeSceneBindings`, um cleanup explícito e idempotente. O menu in-game chama esse cleanup antes de voltar ao menu principal, e a própria cena também o executa em `SHUTDOWN`/`DESTROY`. Bridges de drag/drop e sistemas auxiliares como Shopkeeper/Tavern não devem depender apenas da destruição implícita de objetos Phaser para remover listeners globais.

## Fixes
