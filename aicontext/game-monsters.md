# Game Monsters

## Features

### Monster
`Monster` é a base de inimigos combatentes. Ele estende `Creature`, calcula challenge rating pelo sistema de CR, permite escalonamento para encounters e bosses, e mantém a posição preferencial usada pelo `EnemyTeam`.

Monstros podem receber itens gerados pelo encounter. Ao equipar, o item perde handlers de drag e é reposicionado no monstro. Ao desequipar, o sprite do item é destruído para evitar persistência visual indevida no time inimigo.

FX criados por monstros, como glow, partículas, smoke e timers auxiliares, devem ser limpos em `clearFX` e também quando o monstro é destruído. `reset` reaplica augments inimigos para manter o estado de round consistente.

### RagnarokMonster
`RagnarokMonster` é uma base visual para monstros que usam spritesheets com pares de direção. Ele adapta extração de animações e ajusta o flip visual conforme a direção de movimento calculada pela criatura.

### EnemyTeam
`EnemyTeam` é o grupo de monstros do encounter atual. Ao resetar, ele reposiciona monstros no tabuleiro conforme `preferredPosition` e reposiciona itens já equipados.

Ao receber augment, o time inimigo aplica `onPick` no próprio grupo e emite eventos para a UI. O grupo também expõe emissão de augments e mantém acesso tipado aos filhos como `Monster`.

### MonsterRegistry
`MonsterRegistry` centraliza criação e listagem dos monstros disponíveis para encounters e summons. `create` instancia pela chave registrada, `entries` fornece os construtores para geração de encounter e `getBaseStats` retorna uma cópia dos stats de referência para o sistema de CR.

### Encounters
`generateEncounter` usa `MonsterRegistry`, RNG determinístico por floor, challenge rating e itemização local para montar o time inimigo. Floors de boss escolhem um monstro, aplicam escalonamento de boss e equipam itens conforme CR.

Encontros comuns escolhem monstros do registry, distribuem o CR alvo entre os inimigos e escalam monstros quando necessário. O cache de CR por construtor pode ser invalidado para refletir alterações de balanceamento.

### Challenge Rating
`ChallengeRating` calcula a força relativa de monstros a partir dos stats base e de parâmetros derivados de uma referência registrada. O cache de parâmetros pode ser invalidado, e `computeCR` garante que o resultado permaneça dentro de um domínio válido para o gerador de encounters.

### Skeleton
`Skeleton` é o monstro base da família de esqueletos. Ele atua na linha frontal, possui uma habilidade de golpe direto no alvo atual e usa um FX próprio de impacto sem sangue.

A lista ponderada de esqueletos serve como fonte para summons que invocam variantes esqueléticas. A habilidade preserva o fluxo padrão de casting e usa o cálculo de dano da criatura.

### ArmoredSkeleton
`ArmoredSkeleton` é uma variante defensiva de `Skeleton`. Sua habilidade cria um FX de escudo, concede shield ao próprio monstro e trava mana até o escudo ser quebrado.

O contrato estável é o vínculo entre shield, estado de mana e listener de `shield-broken`, não o valor do escudo.

### SkeletonArcher
`SkeletonArcher` é uma variante de backline da família de esqueletos. Seu ataque básico dispara `Arrow`, e sua habilidade dispara uma flecha especial no alvo atual.

O projétil da habilidade define `onHit`, aplica dano normal pelo cálculo padrão e se destrói ao acertar.

### SkeletonAssassin
`SkeletonAssassin` é uma variante móvel da família de esqueletos. Sua habilidade escolhe um inimigo distante, faz dash para uma posição ao redor desse alvo e aplica dano normal ao completar o deslocamento.

Ao conjurar, o monstro atualiza seu alvo para o inimigo escolhido e libera o estado de casting ao final do fluxo.

### SkeletonNecromancer
`SkeletonNecromancer` é uma variante invocadora da família de esqueletos. Seu ataque básico usa `Deathbolt`, e sua habilidade invoca um esqueleto aliado via `Summon` usando a lista ponderada da família.

O summon recebe atributos derivados do estado atual do caster e é integrado ao fluxo normal de minions do time.

### SkeletonDrainer
`SkeletonDrainer` é uma variante canalizadora da família de esqueletos. Seu ataque básico usa `Deathbolt`, e sua habilidade cria `LifeDrain` junto de um `Dot` sombrio no alvo atual.

A cada tick do status, a habilidade cura o aliado de menor vida do time do caster e cria feedback visual de alma. Ao expirar, o status destrói o FX de drain, encerra channeling e libera casting.

### SkeletonPyromancer
`SkeletonPyromancer` é uma variante de fogo da família de esqueletos. Seu ataque básico usa `Fireball`, e sua habilidade cria `ExplosivePumpkinFx` em uma posição ao redor do alvo.

Quando o pumpkin explode, a habilidade busca inimigos dentro da área visual de explosão, aplica dano fire pelo cálculo padrão e usa o nome da habilidade como fonte.

### SkeletonCryomancer
`SkeletonCryomancer` é uma variante de gelo da família de esqueletos. Seu ataque básico usa `IceShard`, e sua habilidade cria shards ao redor do caster que são disparados contra o alvo atual.

Cada shard configura `onHit`, aplica dano cold pelo cálculo padrão e destrói o projétil. Se o alvo deixa de existir antes do disparo, o shard é destruído.

### Zombie
`Zombie` é um monstro frontal. Sua habilidade aplica dano poison ao alvo atual e cura o próprio monstro com base no dano resolvido.

A habilidade mantém o fluxo de casting local e não cria objetos auxiliares persistentes.

### Demonic
`Demonic` é um caster de backline. Seu ataque básico usa `Fireball`, e sua habilidade agenda disparos de fireballs contra alvos do time do jogador.

Cada fireball da habilidade configura `onHit`, aplica dano fire pelo cálculo padrão e destrói o projétil ao acertar.

## Fixes
