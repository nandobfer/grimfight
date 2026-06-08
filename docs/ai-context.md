# Grim Fight: Contexto Arquitetural para IA

## Resumo

Grim Fight e um autobattler roguelite em `Phaser 3 + React + TypeScript`, com combate automatico, progressao infinita por andares, geracao procedural de encontros por `floor`, crafting de itens no estilo TFT e persistencia local via `localStorage`.

Este documento existe para servir como contexto operacional para IA e para desenvolvedores que precisem alterar o jogo sem reler o codigo inteiro. O foco aqui nao e explicar cada classe individualmente, mas mapear:

- como a aplicacao sobe;
- como um round e orquestrado;
- como os sistemas de combate se compoem;
- como React e Phaser trocam estado;
- como a run e salva/carregada;
- como adicionar novas entidades e sistemas.

## Stack e Runtime

- Engine de jogo: `Phaser 3`, usando `Arcade Physics`, lights, tweens e animações de spritesheet.
- UI/HUD: `React 19` + `MUI`.
- Build web: `Vite`.
- Build desktop: `Electron` via `electron-vite`.
- Graficos/estado visual de combate: no lado Phaser.
- Menus, drawers, modais, counters e tooltip: no lado React.
- Persistencia: `localStorage`.

Arquivo de referencia:

- [package.json](/home/burgos/code/grimfight/package.json:1)
- [src/game/main.ts](/home/burgos/code/grimfight/src/game/main.ts:1)
- [src/ui/Ui.tsx](/home/burgos/code/grimfight/src/ui/Ui.tsx:1)

## Arquitetura em Camadas

O projeto funciona em tres camadas principais.

### 1. Camada Phaser

Responsavel por:

- cena principal do jogo;
- simulacao de combate;
- fisica e colisao;
- grid e posicionamento;
- spawn de personagens, monstros, itens e projeteis;
- VFX, dano, cura, shield e morte.

Ponto central: [src/game/scenes/Game.ts](/home/burgos/code/grimfight/src/game/scenes/Game.ts:1)

### 2. Camada React

Responsavel por:

- HUD de gold, vidas, floor;
- drawers de loja, bench e ficha de personagem;
- traits ativos;
- recount e historico;
- menu e modais de augment/anvil;
- tooltips.

Ponto central: [src/ui/Ui.tsx](/home/burgos/code/grimfight/src/ui/Ui.tsx:1)

### 3. Ponte Phaser <-> React

A comunicacao entre simulacao e UI e feita por um `EventBus` leve, nao por store global centralizada.

Isso significa que a maior parte das integracoes relevantes depende de eventos nomeados. Alteracoes na UI frequentemente exigem:

- emitir novos eventos no Phaser;
- ouvir eventos no React;
- ou o contrario, quando a UI dispara acoes que a cena precisa consumir.

Ponto central: [src/game/tools/EventBus.ts](/home/burgos/code/grimfight/src/game/tools/EventBus.ts:1)

## Bootstrap da Aplicacao

### Fluxo de subida

1. React sobe por `src/main.tsx`.
2. O componente que encapsula Phaser instancia o jogo com `StartGame` de `src/game/main.ts`.
3. O config Phaser registra as cenas `Boot`, `Preloader` e `Game`.
4. `Boot` e `Preloader` carregam assets.
5. A cena `Game` cria arena, times, grid, tavern, shopkeeper, physics e listeners.
6. Quando pronta, `Game` emite `game-ready` no `EventBus`.
7. A UI React usa `useGameScene()` para capturar a instancia da cena e habilitar a camada de HUD/controles.

Arquivos:

- [src/game/main.ts](/home/burgos/code/grimfight/src/game/main.ts:1)
- [src/ui/hooks/useGameScene.ts](/home/burgos/code/grimfight/src/ui/hooks/useGameScene.ts:1)

### Configuracoes importantes de runtime

- Canvas padrao: `768x768`.
- `scale.mode`: `Phaser.Scale.FIT`.
- Em mobile, o projeto pode forcar `CANVAS` em vez de `AUTO`.
- Physics padrao: `arcade`.
- Render prioriza `high-performance`.

## Cena Principal: `Game`

`Game` e o orquestrador central da run. Ele nao faz apenas render da arena; ele tambem concentra progressao, economia, persistencia, round state, milestones de floor e bridges de drag/drop.

Arquivo central:

- [src/game/scenes/Game.ts](/home/burgos/code/grimfight/src/game/scenes/Game.ts:1)

### Estado mantido pela cena

Principais campos:

- `playerTeam`: time do jogador.
- `enemyTeam`: time inimigo do floor atual.
- `grid`: grade tatica e regras de snap/rows.
- `shopkeeper`: ponto de venda.
- `tavern`: ponto de storage/bench.
- `availableItems`: conjunto de itens soltos no board.
- `floor`, `playerGold`, `playerLives`.
- `state`: `"idle"` ou `"fighting"`.
- `currentRecord`: snapshot parcial da run para historico.
- `max_characters_in_board`: cresce com o floor, limitado por `max_characters_in_board = 6`.

### Lifecycle de `create()`

Na criacao da cena:

- habilita debug physics, inicialmente oculto;
- cria background e paredes invisiveis;
- instancia `Grid`, `PlayerTeam`, `EnemyTeam`, `Shopkeeper`, `Tavern` e FX groups;
- configura overlaps e colliders;
- carrega progresso salvo;
- carrega personagens salvos;
- cria tochas e luzes da arena;
- constroi o floor atual;
- instala hotkeys e bridges com a UI;
- emite `game-ready`.

### Hotkeys

- `D`: alterna debug da fisica.
- `SPACE`: inicia round se o estado estiver `idle`.
- `ESC`: pausa e abre menu.

### Estados do jogo

`GameState` tem dois estados:

- `idle`: pre-combate, reposicionamento, bench, compra, equip e drag habilitados.
- `fighting`: combate ativo; movimentacao e habilidades correm automaticamente.

O metodo `changeState()` emite o novo estado em dois canais:

- `this.events.emit("gamestate", state)` dentro da cena;
- `EventBus.emit("gamestate", state)` para a UI.

### Fluxo de round

Fluxo principal:

1. `buildFloor()` cria encontro para o `floor`.
2. `resetFloor()` reposiciona times, define `max_characters_in_board` e coloca o jogo em `idle`.
3. Jogador prepara board, itens, bench e loja.
4. `startRound()` reseta player/enemy, limpa damage chart e entra em `fighting`.
5. Durante o combate, cada `Creature` roda seu update e resolve ataque/cast.
6. Quando um time e wipeado, `finishRound()` delega para `endRoundSoon()`.
7. `finishRoundNow()` decide entre:
   - `onFloorDefeated()`
   - `onPlayerDefeated()`

### Por que existe `endRoundSoon()`

Encerramento de round nao e resolvido diretamente dentro da morte do ator. O jogo primeiro:

- marca `endingRound`;
- muda o estado para `idle`;
- agenda `finishRoundNow()` com `delayedCall(0)`.

Isso evita side effects de resolucao de round no meio do update de criaturas.

### Progressao por floor

`onFloorDefeated()` faz:

- recompensa de gold via `playerTeam.grantFloorReward()`;
- roll de loot via `handleLootReward()`;
- incremento de `floor`;
- limpeza do floor anterior;
- construcao do proximo encontro;
- emite `floor-change`;
- salva progresso.

`onPlayerDefeated()` faz:

- decremento de vidas;
- se vidas zerarem, `gameOver()`;
- senao, recompensa de consolacao e reset do floor.

### Milestones de floor

- Floors multiplos de `5`, exceto `10`: oferecem escolha de augment para o player.
- Floors multiplos de `10`: concedem anvil/artifact logic.
- Inimigos ganham augment em floors `1 + 5n`, exceto o floor 1.

### Loot

Regra atual:

- floor `1`: gera `3` componentes.
- a cada floor multiplo de `10`: gera `1` item.
- existe ainda chance adicional em tres rolls independentes por floor.

### Game Over

`gameOver()`:

- opcionalmente salva record;
- reseta progresso da run;
- volta `floor` para `1`;
- limpa floor e rebuilda o inicio;
- limpa bench;
- embaralha loja;
- emite `gameover`.

## Procedural e Determinismo

O jogo usa mistura de comportamentos deterministas e nao deterministas.

### Procedural deterministico por floor

`generateEncounter(scene, floor, seedBase = 1337)` usa um `RNG` proprio com seed:

- `seed = (floor * 1103515245 + seedBase) >>> 0`

Isso torna a geracao do encontro daquele floor reprodutivel para o mesmo `floor` e `seedBase`, desde que o catalogo/base CR de monstros nao mude.

Arquivo:

- [src/game/tools/Encounter.ts](/home/burgos/code/grimfight/src/game/tools/Encounter.ts:1)
- [src/game/tools/RNG.ts](/home/burgos/code/grimfight/src/game/tools/RNG.ts:1)

### Onde nao ha determinismo forte

Nem toda aleatoriedade passa por esse RNG seedado.

Exemplos:

- `RNG.chance()` usa `Phaser.Math.Between`.
- `RNG.pick()` usa `Phaser.Math.RND.pick`.
- custo/loja/rolagens de varios sistemas usam fontes globais.
- `RNG.characterLevel()` instancia um RNG com mistura de `Date.now()` e `Math.random()`.

Conclusao pratica:

- encontros por floor sao relativamente deterministicos;
- a run como um todo nao e 100% replayavel apenas pelo floor.

## Geracao de Encontros

### Conceito de CR

Cada `Monster` possui `challengeRating`. O encontro tenta atingir um CR alvo proximo ao floor atual.

### Floors normais

`generateEncounter()`:

- calcula `targetCR = max(1, floor)`;
- define quantidade de inimigos entre `1` e `6`, respeitando CR minimo do catalogo;
- divide o CR alvo em shares;
- escolhe monstros do `MonsterRegistry` com pesos baseados na proximidade do share;
- escala monstros para cima quando necessario usando `scaleToCR()`;
- equipa itens em monstros conforme CR.

### Floors de boss

Se `floor % 10 === 0`:

- escolhe um unico monstro;
- chama `makeBoss(targetCR)`;
- aumenta stats, tamanho e mana;
- adiciona aura visual;
- equipa mais itens que o normal.

### Equipamento automatico de monstros

A funcao `equipMonsterWithCRItems()`:

- calcula quantos itens completed o monstro deve receber;
- usa `ItemRegistry.randomCompleted()`;
- evita `thiefsgloves`;
- respeita limite de `3` itens.

## Modelo de Dominio

## `Creature`

Classe base de quase todo ator de combate.

Arquivo:

- [src/game/creature/Creature.ts](/home/burgos/code/grimfight/src/game/creature/Creature.ts:1)

### Responsabilidades

- atributos base e atributos recalculados;
- target selection;
- move, attack e cast;
- mana, crit, lifesteal, armor, shield;
- status effects;
- itens equipados;
- auras;
- UI in-world: health bar e mana bar;
- resposta a dano, cura e morte;
- animacoes e facing.

### Atributos base vs atributos efetivos

`Creature` separa:

- `baseMaxHealth`, `baseAttackDamage`, `baseArmor`, etc;
- `maxHealth`, `attackDamage`, `armor`, etc.

O fluxo esperado e:

1. restaurar stats base;
2. aplicar modificadores;
3. expor atributos finais em combate.

### Ordem de recalculo

Em `Creature.refreshStats()`:

1. `reset()`
2. `applyItems()`
3. `applyAugments()`
4. `applyAuras()`

Em `Character.refreshStats()`:

1. `super.reset()`
2. `applyItems()`
3. `reapplyTraits()`
4. `applyAugments()`
5. `applyAuras()`

Ou seja, personagens do player incluem traits; criaturas genericas nao.

### Combate em alto nivel

Metodos relevantes:

- `newTarget()`
- `getClosestEnemy()`
- `moveToTarget()`
- `avoidOtherCharacters()`
- `isInAttackRange()`
- `startAttack()`
- `landAttack()`
- `startCastingAbility()`
- `castAbility()`

`castAbility()` e um hook vazio na base. Cada personagem/monstro sobrescreve.

### Formula de dano

`onAttackLand()`:

- calcula dano com variacao aleatoria entre `minDamageMultiplier` e `maxDamageMultiplier`;
- pode critar;
- entrega o dano para `victim.takeDamage(...)`.

`takeDamage()`:

- aplica reducao por armor se o dano nao for `true`;
- consome shield antes de HP;
- plota dano no `DamageChart` quando o atacante pertence ao player;
- dispara FX e lifesteal;
- emite eventos como `dealt-damage`, `damage-taken`, `kill`;
- chama `die()` se HP zerar.

### Mana e cast

- `gainMana()` respeita `manaLocked`.
- quando `mana === maxMana`, a criatura tenta `startCastingAbility()`.
- `startCastingAbility()` zera mana e chama `castAbility()`.

### Morte

`die()`:

- ajusta sprite/rotacao de cadaver;
- limpa status;
- para movimento e animacao;
- marca `active = false`;
- toca FX de sangue;
- esconde barras;
- emite `died`;
- roda `wipeCheck()`.

`wipeCheck()` chama `scene.finishRound()` quando o time foi eliminado.

## `Character`

Especializacao de `Creature` para unidades do jogador.

Arquivo:

- [src/game/creature/character/Character.ts](/home/burgos/code/grimfight/src/game/creature/character/Character.ts:1)

### Responsabilidades adicionais

- integra com `PlayerTeam`;
- guarda `boardX` e `boardY`;
- expoe `CharacterDto`;
- tem `LevelBadge`;
- implementa drag-and-drop no board;
- integra com bench, loja e shopkeeper;
- salva itens/evolucao no DTO.

### DTO

`CharacterDto` possui:

- `level`
- `name`
- `id`
- `boardX`
- `boardY`
- `abilityDescription`
- `baseCritDamageMultiplier`
- `items`

Esse DTO e usado em:

- `localStorage`;
- bench;
- loja;
- drag entre React e Phaser;
- reidratacao via `CharacterRegistry`.

### Drag-and-drop do board

O personagem:

- ativa glow ao hover;
- vira draggable no input do Phaser;
- ao `dragstart`, mostra overlays de grid e emite `ph-drag-start`;
- durante drag, atualiza highlight de celula;
- ao `dragend`, pode:
  - snapar no board;
  - ser vendido no `shopkeeper`;
  - ir para `tavern/bench`.

Esse fluxo e parcialmente completado por listeners React via `EventBus`.

### Evolucao

`levelUp()`:

- incrementa `level`;
- multiplica `baseMaxHealth`, `baseAttackDamage` e `baseAbilityPower` por `1.5`;
- reseta stats e UI.

## `Monster`

Especializacao de `Creature` para inimigos do encounter.

Arquivo:

- [src/game/creature/monsters/Monster.ts](/home/burgos/code/grimfight/src/game/creature/monsters/Monster.ts:1)

### Responsabilidades adicionais

- `preferredPosition`: `front`, `middle` ou `back`;
- `challengeRating`;
- `boss`;
- scaling de stats e tamanho;
- FX especiais de boss;
- reset focado em augments.

### Scaling

- `scaleStats(mult)` aumenta vida, dano e AP.
- `scaleSize(mult)` aumenta `baseScale`.
- `makeBoss(targetCR)` transforma o monstro em boss completo.

## `CreatureGroup`, `PlayerTeam` e `EnemyTeam`

## `CreatureGroup`

Arquivo:

- [src/game/creature/CreatureGroup.ts](/home/burgos/code/grimfight/src/game/creature/CreatureGroup.ts:1)

Responsavel por:

- conter criaturas;
- opcionalmente conter um subgrupo `minions`;
- manter `augments`;
- manter `auras`;
- resetar e refrescar stats do grupo;
- verificar wipe;
- adicionar/remover aura de equipe.

### Invariantes importantes

- `runChildUpdate = true`, entao criaturas no grupo rodam `update()`.
- `isWiped()` considera criaturas do grupo e, opcionalmente, minions ativos.
- `addAugment()` faz glow visual, seta `chosenFloor`, reseta o grupo e salva progresso.

## `PlayerTeam`

Arquivo:

- [src/game/creature/character/PlayerTeam.ts](/home/burgos/code/grimfight/src/game/creature/character/PlayerTeam.ts:1)

Sistemas agregados:

- `damageChart`
- `store`
- `bench`
- `activeTraits`

### Responsabilidades

- adicionar personagens ao board;
- tentar merge de triplet;
- recalcular traits;
- persistir composicao;
- conceder recompensas de floor;
- sincronizar UI com `EventBus`.

### Adicao de personagem ao board

Se o personagem ainda nao tiver `boardX/boardY`, `PlayerTeam.add()`:

- busca uma posicao livre nas tres linhas do player;
- posiciona priorizando colunas centrais;
- tenta merge;
- reseta time;
- salva e emite.

### Merge de triplet

Quando existem `3` personagens iguais do mesmo nivel:

- `tryMerge()` seleciona um keeper;
- os outros viram donors;
- `mergeTriplet()` anima donors em direcao ao keeper;
- donors sao destruidos;
- keeper sobe de nivel;
- traits e stats sao recalculados.

### Traits

`resetTraits()`:

- coleta nomes unicos dos personagens em campo;
- chama `TraitsRegistry.compTraits(...)`;
- roda `startApplying()` em cada trait;
- refresca stats;
- emite `active-traits`.

Importante: traits contam nomes unicos em campo, nao copias repetidas fora da logica do registry.

## `EnemyTeam`

Arquivo:

- [src/game/creature/monsters/EnemyTeam.ts](/home/burgos/code/grimfight/src/game/creature/monsters/EnemyTeam.ts:1)

Responsavel por:

- resetar encontro;
- reposicionar monstros conforme `preferredPosition`;
- snapar itens nos inimigos;
- emitir augments inimigos.

### Reposicionamento

`replaceInBoard()` agrupa monstros em buckets:

- `front`
- `middle`
- `back`

Depois distribui:

- front nas linhas mais proximas do player;
- middle na linha intermediaria;
- back nas linhas traseiras;
- overflow sobe para linhas de tras, nunca para o lado do player.

## Store, Bench e Economia

## `CharacterStore`

Arquivo:

- [src/game/creature/character/CharacterStore.ts](/home/burgos/code/grimfight/src/game/creature/character/CharacterStore.ts:1)

### Como funciona

- loja guarda ate `5` ofertas.
- cada oferta tem `character`, `cost`, `sold`.
- `shuffle()` gera nova loja baseada no maior nivel ja alcancado em board/bench.
- custo de reroll pago: `2` gold quando `free = false`.
- custo de compra cresce por nivel com `3^(level - 1)`, minimo `1`.

### Compra

`buy(item)`:

- desconta gold;
- marca oferta como vendida;
- adiciona personagem no bench;
- auto-summon se ainda houver slot livre no board e o jogo estiver `idle`.

## `Bench`

Arquivo:

- [src/game/creature/character/Bench.ts](/home/burgos/code/grimfight/src/game/creature/character/Bench.ts:1)

### Funcoes principais

- guardar `CharacterDto` fora do board;
- salvar/carregar bench;
- invocar personagem de volta ao board com `summon()`;
- vender personagem do bench;
- resolver merges que nascem no proprio bench.

### Detalhe importante

`Bench.add()` pode disparar evolucao automaticamente:

- se houver copias suficientes no bench e/ou no board;
- podendo inclusive invocar copias do bench para forcar merge quando ha unidade correspondente no board.

## Itens

## `Item`

Arquivo:

- [src/game/systems/Items/Item.ts](/home/burgos/code/grimfight/src/game/systems/Items/Item.ts:1)

### Papel

`Item` representa tanto componentes quanto itens completed/artifacts. A classe base lida com:

- sprite e borda visual;
- drag-and-drop;
- tooltip;
- snap no personagem;
- drop no board;
- preview de merge entre itens;
- equip/unequip com personagem.

### Hooks esperados

Subclasses de item sobrescrevem:

- `applyModifier(creature)`
- `afterApplying(characters)`
- `cleanup(creature)`

### Fluxo de drag

Ao arrastar um item:

- se soltar sobre personagem valido, equipe;
- se soltar fora, volta a ser item solto;
- se pairar sobre outro item compativel, mostra preview do merge resultante;
- se pairar sobre personagem, pode mostrar preview da composicao final.

### Slot limit

`snapToCreature()` impede equip em criatura com `3` itens, exceto em alguns fluxos especiais onde o mesmo item ja pertence a ela.

## `ItemRegistry`

Arquivo:

- [src/game/systems/Items/ItemRegistry.ts](/home/burgos/code/grimfight/src/game/systems/Items/ItemRegistry.ts:1)

### Categorias

- `components`
- `completed`
- `artifacts`

### Responsabilidades

- registrar classes de item;
- criar instancias por nome;
- obter random por categoria;
- resolver recipe resultante de dois componentes;
- expor catalogo completo.

### Observacao pratica

As recipes estao codificadas no proprio registry. Se uma combinacao mudar, tanto a documentacao quanto a logica do jogo dependem desse arquivo.

## Traits

## `Trait`

Arquivo:

- [src/game/systems/Traits/Trait.ts](/home/burgos/code/grimfight/src/game/systems/Traits/Trait.ts:1)

### Contrato base

Uma trait define:

- `name`
- `description`
- `comp`: quais personagens contam para a sinergia
- `stages`: thresholds e valores
- `activeComp`
- `activeStage`

### Lifecycle

- `startApplying(characters)` calcula a composicao ativa.
- `getActiveStage()` decide o stage atual.
- `tryApply(character)` limpa e reaplica o bonus naquele personagem, se elegivel.
- `afterApplying()` e um hook opcional.

### Modelo mental

Traits sao modificadores de composicao de time. Elas nao vivem nas unidades; vivem no time e sao reavaliadas apos mudancas de roster.

## Augments

## `Augment`

Arquivo:

- [src/game/systems/Augment/Augment.ts](/home/burgos/code/grimfight/src/game/systems/Augment/Augment.ts:1)

### Contrato base

Um augment define:

- `name`
- `description`
- `chosenFloor`
- `values`
- `descriptionValues`
- `color`

Hooks:

- `applyModifier(creature)`
- `onPick(team)`

### Aplicacao no fluxo

- player ganha escolha em alguns floors;
- enemy ganha augments em milestones especificos;
- `addAugment()` grava o floor, aplica glow visual, reseta grupo e salva progresso.

## Auras

Auras sao buffs de equipe com escopo mais estrutural que um item individual.

Arquivos relevantes:

- `src/game/systems/Aura/Aura.ts`
- `GuardianAura`
- `SmiteAura`
- `PaladinAura`
- `ProtectionAura`

### Aplicacao

Uma criatura ou time pode conter `auras`.

Na fase de `refreshStats()` de cada criatura:

- auras proprias sao aplicadas;
- auras do time sao aplicadas;
- se a criatura e minion, auras do time do master tambem podem ser aplicadas.

## Status Effects

Os status ficam sob `src/game/objects/StatusEffect`.

Tipos relevantes:

- `StatusEffect`
- `Condition`
- `Dot`
- `Freeze`
- `Hot`

### Papel

- dano periodico;
- crowd control;
- efeitos temporarios de buff/debuff;
- timers associados ao alvo e ao usuario.

`Creature.statusEffects` guarda um `Set<StatusEffect>`.

## Projeteis

## `Projectile`

Arquivo:

- [src/game/objects/Projectile/Projectile.ts](/home/burgos/code/grimfight/src/game/objects/Projectile/Projectile.ts:1)

### Papel

Classe base para ataques e habilidades ranged, como:

- `Arrow`
- `Fireball`
- `HolyShield`
- `IceShard`
- `Lightningbolt`

### Comportamento base

- sabe quem e o `owner`;
- nasce inativo;
- ao `fire(target)`, recebe velocidade e rotacao;
- cria collider com paredes;
- cria overlap com time inimigo e minions inimigos;
- chama `onHit(target)` quando colide;
- se destroi e limpa watchdog/colliders/tweens/lights.

### Observacao importante

Projeteis ouvem `gamestate` e se destroem em mudancas de estado, evitando restos de round anterior.

## Casos Exemplares de Personagens

## `Lizwan`

Arquivo:

- [src/game/creature/classes/Lizwan.ts](/home/burgos/code/grimfight/src/game/creature/classes/Lizwan.ts:1)

### O que demonstra

`Lizwan` e um bom exemplo de personagem com passiva baseada em ataque, sem cast convencional:

- `baseMaxMana = 0`
- `manaLocked = true`
- `landAttack()` aplica `Dot` de veneno em cada hit

Ela mostra o padrao:

- sobrescrever stats base;
- sobrescrever `getAbilityDescription()`;
- usar `landAttack()` em vez de `castAbility()`.

## `Lalatina`

Arquivo:

- [src/game/creature/classes/Lalatina.ts](/home/burgos/code/grimfight/src/game/creature/classes/Lalatina.ts:1)

### O que demonstra

`Lalatina` e um exemplo de personagem dependente de placement:

- aura muda conforme `front`, `middle` ou `back`;
- `onPlacementChange()` troca a aura ativa;
- `castAbility()` tem efeito diferente dependendo da posicao;
- usa projectile customizado (`HolyShield`);
- limpa aura ao ser destruida.

Ela mostra o padrao de personagem que:

- depende do board e nao so de stats;
- altera o time inteiro;
- combina projectile, aura e healing/shield.

## UI React

## `Ui.tsx`

Arquivo:

- [src/ui/Ui.tsx](/home/burgos/code/grimfight/src/ui/Ui.tsx:1)

### Composicao

Quando `game-ready` chega:

- a UI passa a renderizar drawers, modais e HUD;
- o componente fica em overlay absoluto sobre o canvas;
- `pointerEvents` sao seletivos para nao bloquear o board todo.

Principais componentes renderizados:

- `ItemAnvilModal`
- `PlayerAugments`
- `DebugMenu`
- `Traits`
- `CharacterStoreDrawer`
- `CharacterDrawer`
- `TavernDrawer`
- `Counters`
- `Recount`
- `GameStateButtons`
- `GameMenu`
- `ItemTooltip`

## Hooks de integracao

### `useGameScene()`

Arquivo:

- [src/ui/hooks/useGameScene.ts](/home/burgos/code/grimfight/src/ui/hooks/useGameScene.ts:1)

Ouve `game-ready` e guarda a instancia de `Game`.

### `useCharacterBridge()`

Arquivo:

- [src/ui/hooks/useCharacterBridge.ts](/home/burgos/code/grimfight/src/ui/hooks/useCharacterBridge.ts:1)

Responsavel por sincronizar drag do board Phaser com area de bench React.

Fluxo:

- ouve `ph-drag-start`, `ph-drag-move`, `ph-drag-end`;
- calcula se o ponteiro esta dentro da area React monitorada;
- emite:
  - `bench-hover-enter`
  - `bench-hover-leave`
  - `bench-drop`
  - `bench-cancel`

Esse hook e essencial para o drag cruzando o limite canvas -> DOM.

## EventBus: Eventos Estruturais

Esta nao e uma lista absolutamente completa, mas cobre os eventos mais importantes.

### Estado e bootstrap

- `game-ready`
- `gamestate`
- `load-complete`
- `open-menu`
- `unpause`
- `gameover`

### Progresso e counters

- `get-progress`
- `load-progress`
- `gold-change`
- `lives-change`
- `floor-change`

### Personagens

- `characters-change`
- `select-char`
- `character-{id}-update`

### Bench e drag

- `ph-drag-start`
- `ph-drag-move`
- `ph-drag-end`
- `bench-hover-enter`
- `bench-hover-leave`
- `bench-drop`
- `bench-cancel`
- `toggle-bench`
- `bench-character-tavern`

### UI -> board

- `ui-drag-start`
- `ui-drag-move`
- `ui-drag-end`

### Loja e venda

- `sell-character-shopkeeper`
- `character-store`
- `character-bench`

### Traits e augments

- `active-traits`
- `augments-change`
- `augments-add`
- `enemies-augments-change`
- `enemies-augments-add`
- `choose-augment`
- `ui-augment`
- `ui-anvil`

### Tooltip de item

- `item-tooltip`

## Persistencia

Toda a persistencia principal e local.

## Chaves de `localStorage`

- `progress`
- `characters`
- `bench`
- `store`
- `gamerecords`

## `progress`

Representa `GameProgressDto`:

- `playerLives`
- `playerGold`
- `floor`
- `version`
- `playerAugments`
- `enemyAugments`
- `availableItems`
- `record`

## `characters`

Array de `CharacterDto` correspondente ao board salvo do jogador.

## `bench`

Array de `CharacterDto` mantidos fora do board.

## `store`

Snapshot da loja atual.

## `gamerecords`

Historico de runs finalizadas, contendo pelo menos:

- `augments`
- `comp`
- `finishedAt`
- `floor`

## Reidratacao

### Personagens

`Game.loadPlayerCharacters()`:

- le `characters`;
- chama `CharacterRegistry.create(dto.name, ...)`;
- adiciona no `PlayerTeam`;
- chama `character.loadFromDto(dto)`.

### Itens e augments

Em `loadProgress()`:

- itens sao recriados por `ItemRegistry.create(itemKey, this)`;
- augments sao recriados por `AugmentsRegistry.create(aug.name, aug)`.

### Implicacao

Registries sao fonte de verdade para reidratar objetos vivos a partir de nomes persistidos.

## Registries

## `CharacterRegistry`

Arquivo:

- [src/game/creature/CharacterRegistry.ts](/home/burgos/code/grimfight/src/game/creature/CharacterRegistry.ts:1)

Responsavel por:

- registrar classes jogaveis por nome;
- criar instancias;
- carregar DTO;
- randomizar personagens.

### Importante

Se um personagem nao estiver registrado, saves antigos que o referenciem quebram na carga.

## Outros registries relevantes

- `MonsterRegistry`
- `ItemRegistry`
- `TraitsRegistry`
- `AugmentsRegistry`

Todos seguem o mesmo principio: nome persistido -> classe concreta -> instancia viva.

## Como Estender o Jogo

## Adicionar um novo personagem

Passos:

1. Criar uma nova classe em `src/game/creature/classes`.
2. Herdar de `Character`.
3. Definir stats base.
4. Sobrescrever os hooks necessarios:
   - `getAbilityDescription()`
   - `castAbility()`
   - `landAttack()`
   - `onPlacementChange()`
   - `refreshStats()`
5. Garantir spritesheets e animacoes correspondentes.
6. Registrar no `CharacterRegistry`.
7. Se fizer parte de trait, atualizar `TraitsRegistry`.

Checklist mental:

- funciona em DTO/load?
- nome da classe bate com asset key?
- animações existem?
- item/trait/augment recalculam sem side effects indevidos?

## Adicionar um novo monstro

Passos:

1. Criar classe em `src/game/creature/monsters`.
2. Herdar de `Monster`.
3. Definir stats base, `preferredPosition` e comportamento de habilidade.
4. Registrar no `MonsterRegistry`.
5. Validar CR calculado e scaling.
6. Garantir spritesheet e assets.

## Adicionar um novo item

Passos:

1. Criar classe em uma das pastas:
   - `components`
   - `completed`
   - `artifact`
2. Herdar de `Item`.
3. Implementar ao menos `applyModifier()` e, se necessario, `cleanup()`.
4. Registrar no `ItemRegistry`.
5. Se for completed, adicionar recipe no registro.
6. Garantir asset em `public/assets/items`.

## Adicionar uma nova trait

Passos:

1. Criar classe herdando `Trait`.
2. Definir `comp`, `stages`, `description` e `applyModifier()`.
3. Registrar em `TraitsRegistry`.
4. Validar quando `PlayerTeam.resetTraits()` a ativa.

## Adicionar um novo augment

Passos:

1. Criar classe herdando `Augment`.
2. Definir descricao, valores e cor.
3. Implementar `applyModifier()` e/ou `onPick(team)`.
4. Registrar em `AugmentsRegistry`.
5. Garantir que pode ser recriado por nome ao carregar save.

## Adicionar um novo projectile ou status

### Projectile

1. Herdar de `Projectile`.
2. Ajustar sprite, escala, hit behavior e efeitos de luz.
3. Instanciar a partir da habilidade do personagem/monstro.

### Status

1. Herdar de `StatusEffect` ou de subclass apropriada.
2. Definir timers, tick e cleanup.
3. Aplicar a partir de item, trait, aura, ataque ou habilidade.

## Invariantes e Armadilhas

## 1. `Game.ts` e o hub principal

Ele concentra mais responsabilidade do que uma cena minima:

- runtime da run;
- persistencia;
- milestones;
- drag bridges;
- spawn de itens;
- encerramento de round.

Mudancas ali tem alto raio de impacto.

## 2. `EventBus` e contrato critico

Grande parte da comunicacao UI/simulacao depende de nomes de evento literais. Renomear ou remover eventos quebra fluxos silenciosamente.

## 3. Existem dois sentidos de drag

- React -> Phaser: bench/store para board, via `ui-drag-*`.
- Phaser -> React: board para bench, via `ph-drag-*`.

Esses fluxos sao diferentes e complementares.

## 4. Registries sustentam save/load

Salvar guarda nomes, nao implementacoes serializadas. Se um nome mudar, o load quebra.

## 5. Traits sao recalculadas a partir do roster

Ao mexer em summons, merges ou bench, o importante e garantir que `resetTraits()` e `refreshAllStats()` continuem disparando nos pontos corretos.

## 6. Nem toda aleatoriedade e seedada

Nao assumir replay deterministico total da run.

## 7. `max_characters_in_board` depende do floor

O limite cresce com o floor, mas e capado em `6`. Isso afeta summon automatico, loja e bench.

## 8. `availableItems` representa itens soltos

Ao equipar item em `Character`, o item sai desse set. Ao desequipar, volta.

## 9. Morte e fim de round sao assincronos

`finishRound()` nao resolve imediatamente. Nao escrever logica assumindo que o floor mudou no exato frame da morte.

## Mapa Rapido de Arquivos Centrais

- Cena principal: [src/game/scenes/Game.ts](/home/burgos/code/grimfight/src/game/scenes/Game.ts:1)
- Base de combate: [src/game/creature/Creature.ts](/home/burgos/code/grimfight/src/game/creature/Creature.ts:1)
- Personagem do player: [src/game/creature/character/Character.ts](/home/burgos/code/grimfight/src/game/creature/character/Character.ts:1)
- Time do player: [src/game/creature/character/PlayerTeam.ts](/home/burgos/code/grimfight/src/game/creature/character/PlayerTeam.ts:1)
- Bench: [src/game/creature/character/Bench.ts](/home/burgos/code/grimfight/src/game/creature/character/Bench.ts:1)
- Loja: [src/game/creature/character/CharacterStore.ts](/home/burgos/code/grimfight/src/game/creature/character/CharacterStore.ts:1)
- Monstro base: [src/game/creature/monsters/Monster.ts](/home/burgos/code/grimfight/src/game/creature/monsters/Monster.ts:1)
- Time inimigo: [src/game/creature/monsters/EnemyTeam.ts](/home/burgos/code/grimfight/src/game/creature/monsters/EnemyTeam.ts:1)
- Encounter procedural: [src/game/tools/Encounter.ts](/home/burgos/code/grimfight/src/game/tools/Encounter.ts:1)
- Item base: [src/game/systems/Items/Item.ts](/home/burgos/code/grimfight/src/game/systems/Items/Item.ts:1)
- Registry de itens: [src/game/systems/Items/ItemRegistry.ts](/home/burgos/code/grimfight/src/game/systems/Items/ItemRegistry.ts:1)
- Projectile base: [src/game/objects/Projectile/Projectile.ts](/home/burgos/code/grimfight/src/game/objects/Projectile/Projectile.ts:1)
- Trait base: [src/game/systems/Traits/Trait.ts](/home/burgos/code/grimfight/src/game/systems/Traits/Trait.ts:1)
- Augment base: [src/game/systems/Augment/Augment.ts](/home/burgos/code/grimfight/src/game/systems/Augment/Augment.ts:1)
- UI principal: [src/ui/Ui.tsx](/home/burgos/code/grimfight/src/ui/Ui.tsx:1)
- Hook de bridge da cena: [src/ui/hooks/useGameScene.ts](/home/burgos/code/grimfight/src/ui/hooks/useGameScene.ts:1)
- Hook de bridge board/bench: [src/ui/hooks/useCharacterBridge.ts](/home/burgos/code/grimfight/src/ui/hooks/useCharacterBridge.ts:1)

## Uso Recomendado por IA

Se uma IA for trabalhar neste repositorio, a ordem mais eficiente de leitura costuma ser:

1. `src/game/scenes/Game.ts`
2. `src/game/creature/Creature.ts`
3. `src/game/creature/character/Character.ts`
4. `PlayerTeam`, `EnemyTeam`, `CreatureGroup`
5. `Encounter`, `ItemRegistry`, `Trait`, `Augment`
6. A classe concreta que sera alterada
7. Componentes React afetados e eventos do `EventBus`

Para qualquer mudanca, a IA deve validar pelo menos:

- se ha save/load envolvido;
- se o cambio afeta traits/augments/auras;
- se o fluxo mexe com `EventBus`;
- se o comportamento so vale em `idle`, so em `fighting`, ou nos dois;
- se precisa atualizar registry ou assets.
