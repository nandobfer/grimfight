# Game Creature Core

## Features

### Creature
`Creature` é a base de toda unidade combatente do jogo. Personagens jogáveis, monstros e minions reutilizam essa classe para stats, combate automático, movimento, alvo, itens, status effects, auras, augments, UI interna e efeitos visuais.

### Construction
O construtor consulta `CreatureVisualRegistry` para decidir textura e frame inicial. Quando a instância não é apenas de dados, ela registra sprite e physics na cena, cria animações, inicializa barras de vida e mana, configura corpo físico e aplica pipeline visual.

O modo data-only permite criar entidades sem inicializar objetos Phaser pesados, útil para operações de registro, seleção ou cálculo que não precisam de sprite real.

### Stats And Refresh
`calculateStats` deriva os stats atuais a partir dos valores base e reseta shield. `calculateSpeeds` mantém velocidade e attack speed separados para permitir overrides por subclasses.

`reset` recalcula stats, restaura vida e mana, limpa locks, status effects, conditions, alvo, rotação, alpha e estado de movimento. Também reposiciona itens equipados e reseta a UI interna.

`refreshStats` protege contra reentrada com `isRefreshing`, executa reset e reaplica itens, augments e auras dentro de um bloco com cleanup garantido do estado de refresh.

### Modifiers
Itens aplicam cleanup antes de reaplicar seus modificadores. Augments vêm do time do próprio combatente ou do time do master quando a criatura é minion. Auras podem vir da própria criatura, do time e do time do master.

Esse contrato evita acúmulo indevido de bônus entre rounds, refreshes e mudanças de composição.

### Channeling And Locks
`startChanneling` trava ataque, mana e movimento. `stopChanneling` libera esses mesmos locks. Subclasses usam esse contrato para habilidades canalizadas, dashes e efeitos temporários.

Os locks também são respeitados por movimento, ataque, regeneração de mana e conjuração para preservar o ciclo de combate automático.

### Targeting And Movement
`getEnemyTeam` escolhe o time adversário com base no time da criatura ou do master. `newTarget` limpa movimento, entra em idle, escolhe o inimigo mais próximo e atualiza direção.

`getClosestEnemy` e `getFartestEnemy` ignoram inimigos inativos ou não alvejáveis. `moveToTarget` caminha em direção ao alvo quando a criatura pode se mover. `avoidOtherCharacters` ajusta o deslocamento para reduzir colisões e aglomeração.

`teleportTo` sincroniza sprite, body e evento de movimento. `dashTo` usa tween e emite movimento ao completar. `removeFromEnemyTarget` limpa referências de inimigos que estavam mirando a criatura e pode torná-la temporariamente não alvejável.

### Facing And Animation
`updateFacingDirection` calcula a direção visual a partir do alvo. `getOppositeDirection` fornece a direção inversa para posicionamentos ao redor de alvos.

`createAnimations` usa uma definição visual registrada quando existir; caso contrário, extrai animações do spritesheet padrão. `onAnimationFrame` executa callbacks no frame configurado da animação e remove listeners ao completar ou parar.

### Combat
`startAttack` valida estado de ataque, casting, alvo, locks e frozen antes de iniciar a animação de ataque. O impacto chama `landAttack`, que por padrão delega para `onAttackLand`.

`calculateDamage` aplica crítico e variação de dano conforme a configuração atual da criatura. `onAttackLand` resolve dano contra o alvo e chama `onHit`. `onHit` concede mana ao alvo e ao atacante e emite o evento de pós-ataque.

### Damage Healing And Shield
`takeDamage` resolve armor, true damage, block, shield, dano em vida, damage text, hit FX, lifesteal, morte e eventos de dano. Quando shield é consumido completamente, emite `shield-broken`.

`heal` respeita criaturas inativas, limita a vida ao máximo, atualiza UI e emite evento quando existe fonte de cura. `gainShield` limita o shield ao máximo de vida, atualiza UI, registra cura de shield no damage chart quando aplicável e emite evento.

### Mana And Casting
`gainMana` respeita `manaLocked`, atualiza UI e inicia conjuração quando a mana chega ao máximo e a criatura pode castar. `regenMana` converte delta de update em ganho de mana e não roda durante casting.

`startCastingAbility` zera mana, atualiza UI, chama `castAbility` e emite o evento de cast. Subclasses implementam a habilidade concreta sobrescrevendo `castAbility`.

### Death And Wipe
`die` ajusta pose final, limpa status effects, para movimento/animação, desativa a criatura, reduz depth, executa FX de morte, esconde UI e emite eventos de morte para time e listeners locais.

`wipeCheck` encerra a rodada quando o time relevante foi eliminado, considerando o caso de minions vinculados a master. `revive` restaura estado ativo mínimo e ressincroniza UI e depth.

### Items
`getMergeResult` identifica receitas válidas entre item recebido e componentes já equipados. `tryMerge` cria o item completo, remove componentes do inventário local da cena, destrói sprites antigos, reposiciona o item resultante e reseta tooltip.

`equipItem` aplica regras de slots e Thief's Gloves, transfere item de usuário anterior quando necessário, adiciona o item ao set da criatura, atualiza `user`, refresca stats quando apropriado e registra sync de posição no evento de movimento.

`unequipItem` remove o item, executa cleanup, refresca stats quando apropriado, remove listener de movimento e ressincroniza itens restantes.

### Auras And Status Effects
`addAura` aplica imediatamente a aura na criatura. `removeAura` chama cleanup antes de remover a aura do set local.

`selfUpdate` atualiza depth, mana e todos os status effects ativos. Se a vida chega a zero enquanto a criatura está ativa, a morte é resolvida antes do restante do update.

### UI And FX
`resetUi`, `updateCharUi` e `destroyUi` controlam barras internas de vida e mana. Hit FX, heal FX, glow temporário, aura glow e death FX ficam no lado Phaser da criatura e devem ter cleanup quando criam listeners, tweens ou objetos persistentes.

### Update Loop
`update` ignora lógica de combate durante `idle`. Durante combate, mantém UI posicionada, busca novo alvo quando necessário, executa lógica com alvo e roda `selfUpdate`.

O contrato central é manter regra de combate em `src/game`, preservar o ciclo `idle` e `fighting`, e evitar trabalho desnecessário ou vazamentos no loop de update.

## Fixes
