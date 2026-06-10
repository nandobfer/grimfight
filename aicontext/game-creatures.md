# Game Creatures

## Features

### Archer
Archer é um personagem jogável registrado como `laherce`. Ele mantém ataque básico à distância usando `Arrow` e sua habilidade dispara uma rajada em cone na direção do alvo atual ou da direção em que está virado.

A habilidade cria projéteis independentes, configura o dano no `onHit` de cada flecha e usa o cálculo padrão de dano do `Creature`. A regra deve permanecer na classe do personagem e nos projéteis, sem mover a lógica de combate para UI.

### Arthas
Arthas é um personagem jogável registrado como `arthas`. Ele possui lifesteal passivo e uma sequência de conjurações de `Frost Strike` que alterna entre golpe no alvo, golpe em área frontal e pilares de gelo em inimigos.

A classe mantém um contador de casts para avançar a sequência e reseta esse estado em `refreshStats`. O efeito visual de luz acompanha o personagem durante o ciclo de vida e remove listeners/lights quando o personagem é destruído.

### Banguela
Banguela é um personagem jogável registrado como `banguela`. Ele usa `Fireball` no ataque básico à distância e sua habilidade cria orbes de fogo temporários que disparam contra o alvo atual após um atraso.

Cada fireball da habilidade define seu próprio `onHit`, aplica dano de fogo via cálculo padrão de dano e destrói o projétil ao acertar. Os orbes entram no grupo de FX por rodada para limpeza junto ao combate.

### Barbarian
Barbarian é um personagem jogável registrado como `grok`. Ele não usa mana para conjurar e opera com uma passiva de berserker que escala velocidade e attack speed conforme sua vida muda.

`refreshStats` guarda os valores base usados pela passiva e `update` recalcula os atributos enquanto o personagem está ativo. O efeito visual de tint indica o estado de vida conforme a regra atual da classe.

### Chichi
Chichi é um personagem jogável registrado como `chichi`. Sua habilidade cria um clone temporário que herda estado de combate do mestre, é adicionado aos minions do time e muda o comportamento de ataque conforme a posição inicial do personagem.

Na posição frontal, o clone atua como tanque e pode receber cura dos ataques do mestre. Na posição do meio, o clone avança para um inimigo distante e viabiliza disparos de `WindRazor`. Na posição traseira, o clone canaliza cura no aliado de menor vida com `SoothingMist` e `Hot`.

`destroyClone` remove o clone, limpa beams/status de cura, destrava mana do mestre e restaura o ataque padrão. Qualquer FX ou status criado pela habilidade deve ser limpo quando o clone termina.

### Dracula
Dracula é um personagem jogável registrado como `dracula`. Ele possui lifesteal passivo, observa a morte do alvo atual e ganha benefício de sustain/ofensivo quando esse alvo morre.

A habilidade ativa troca o alvo para um inimigo de menor vida e modifica temporariamente o próximo ataque para aplicar dano sombrio adicional. Observers de morte são removidos em `refreshStats`, ao trocar de alvo ou quando o personagem é destruído.

### Helyna
Helyna é uma personagem jogável registrada como `helyna`. Ela usa a habilidade `Druidism` para alternar entre forma humana, urso ou gato conforme a posição inicial.

Na forma humana, Helyna mantém ataque à distância e pode curar o aliado de menor vida com `Hot`. Na forma de urso, transforma atributos defensivos/ofensivos e pode ativar armadura de espinhos que retaliará atacantes. Na forma de gato, transforma atributos ofensivos e pode aplicar sangramento com `Dot`.

`refreshStats` retorna Helyna para a forma humana, restaura caches de atributos e reseta o estado de thorns. O nome de textura/animação deve refletir a forma ativa.

### Frank
Frank é um personagem jogável registrado como `frank`. Ele não usa mana para conjurar e possui uma passiva que conta ataques para periodicamente drenar vida do alvo.

Quando o ataque configurado da sequência é alcançado, `drainLife` aplica dano venenoso calculado pela regra atual e cura Frank com base no resultado. `refreshStats` reseta o contador para evitar acúmulo indevido entre rounds.

### Freud
Freud é um personagem jogável registrado como `freud`. Ele não usa mana para conjurar e possui duas passivas: uma de retarget corpo a corpo quando inimigos entram em alcance adjacente, e outra de dano sombrio adicional em críticos.

Ao entrar em combate, Freud observa movimento dos inimigos para tentar retarget imediato. Ao sair de combate, fazer refresh ou destruir o personagem, remove todos os observers registrados. Em críticos, `SoulKnife` aplica o dano normal e, se o alvo continuar ativo, aplica dano sombrio adicional e concede escudo baseado no dano efetivamente causado.

### Lalatina
Lalatina é uma personagem jogável registrada como `lalatina`. Ela arremessa `HolyShield` no alvo atual e aplica um voto adicional conforme sua posição inicial.

Na posição frontal, concede escudo a aliados próximos. Na posição do meio, configura o escudo para critar e aplicar burn. Na posição traseira, cura o aliado de menor vida. Sua passiva aplica uma aura de time por posição e substitui a aura anterior quando a posição muda.

Ao destruir Lalatina, a aura ativa deve ser removida do time. `applyAura` é responsável por remover aura antiga, criar a aura correta, adicionar ao time e atualizar stats do grupo.

### Lizwan
Lizwan é um personagem jogável registrado como `lizwan`. Ele não usa mana para conjurar e aplica veneno a cada ataque.

`landAttack` preserva o ataque base, cria feedback visual de veneno e aplica um `Dot` do tipo poison no alvo atual. O status carrega usuário, alvo e nome da habilidade para integração com damage chart e cleanup do sistema de status.

### Mage
Mage é uma personagem jogável registrada como `megumin`. Ela usa `Fireball` no ataque básico e sua habilidade causa explosão de fogo no alvo atual.

`castAbility` calcula dano pelo fluxo padrão do `Creature`, aplica dano fire ao alvo e cria `Explosion` para afetar inimigos adjacentes conforme a implementação do FX/sistema. `refreshStats` inicializa mana conforme a regra atual da personagem.

### Knight
Knight é um personagem jogável registrado como `maximus`. Sua habilidade cria um escudo mágico em si mesmo e trava mana enquanto o escudo existir.

`castAbility` cria `MagicShieldFx`, chama `gainShield` com a fórmula atual da classe e registra listener de `shield-broken` para destravar mana. O teste desse contrato deve focar no estado de mana e no registro do listener, não no valor do escudo.

### Melo
Melo é um personagem jogável registrado como `melo`. Ele usa `Holybolt` no ataque básico e sua habilidade cura aliados priorizando os que têm menor proporção de vida.

`castAbility` ordena aliados pela fração de vida, cura os alvos selecionados com o cálculo padrão e cria `HolyHeal` para feedback visual. `refreshStats` inicializa mana conforme a regra atual do personagem.

### Rogue
Rogue é um personagem jogável registrado como `mordred`. Sua habilidade remove temporariamente o personagem da lista de alvos inimigos, escolhe o inimigo mais distante, teleporta para uma posição em torno dele e aplica dano normal imediato.

A habilidade cria fumaça de teleporte antes e depois do deslocamento, agenda cleanup das partículas e sempre libera o estado de casting ao final.

### Necromancer
Necromancer é um personagem jogável registrado como `zairon`. Ele usa ataque básico sombrio à distância e sua habilidade invoca um esqueleto aliado via `Summon`.

O summon recebe atributos derivados do estado atual do necromancer e é integrado ao time como minion. Se houver trait `Deatheater` ativa, a trait é aplicada ao esqueleto recém-invocado. A função de mapeamento de escala deve retornar valores finitos para entradas válidas.

### Reno
Reno é um personagem jogável registrado como `reno`. Ele não usa mana para conjurar, mantém attack speed travado e converte bônus de attack speed em attack damage.

`scaleAdFromAs` recalcula o dano convertido a partir do attack speed atual, `update` detecta mudanças nesse atributo e `refreshStats` reseta a conversão e o contador de ataques. Periodicamente, seu ataque transforma o projétil em um disparo especial com dano frio adicional.

### Rokmora
Rokmora é um personagem jogável registrado como `rokmora`, com os traits `Druid` e `Colossi`. Ele usa os atributos base de Lalatina para vida, ataque, velocidade e cadência, mas não usa mana para conjurar e opera como personagem de habilidade passiva.

Enquanto está ativa, Rokmora navega em ciclo pelas constelações `archer`, `dragon` e `chalice`, inclusive durante `idle`; `refreshStats` sempre retorna o ciclo para `archer`. A constelação do Arqueiro adiciona uma estrela temporária ao fim da própria constelação e, depois de um pequeno atraso configurável, essa estrela se desprende, avança brilhando contra o alvo atual capturado no ataque e causa dano radiante ao colidir. A constelação do Dragão concede escudo ao receber dano, calculado a partir do dano pré-mitigação e da armadura atual de Rokmora. A constelação da Taça pulsa periodicamente durante combate, distribuindo cura entre todos os aliados feridos, incluindo ele próprio.

O FX visual da constelação acompanha Rokmora em `update`, interpola a cor entre uma constelação e outra e inverte o sentido da órbita a cada mudança. As estrelas temporárias do Arqueiro reutilizam o mesmo desenho das estrelas da constelação enquanto orbitam e também quando se tornam projéteis. Os tweens de órbita, pulso e transição devem ser removidos junto com o personagem, e os timers/tweens/colliders/lights das estrelas temporárias devem ser limpos quando o FX ou o projétil termina.

As fórmulas puras da passiva ficam em `src/game/creature/classes/RokmoraConstellations.ts` para manter a regra testável sem instanciar Phaser.

### Rukia
Rukia é uma personagem jogável registrada como `rukia`. Ela aplica dano frio passivo após ataques e sua habilidade executa uma cadeia de dashes atacando inimigos escolhidos pelo sistema de RNG.

Durante a habilidade, Rukia trava mana, se move por tween entre alvos, aplica dano normal e frio por ataque e retorna ao alvo original quando a cadeia termina ou é interrompida. A mudança de `gamestate` deve parar a cadeia e acionar cleanup do estado de casting/mana.

### Sorcerer
Sorcerer é uma personagem jogável registrada como `jadis`. Ela usa `IceShard` no ataque básico e canaliza `Blizzard` no alvo atual.

`castAbility` inicia channeling, cria o efeito de blizzard com os parâmetros atuais da classe e libera o estado de casting. `refreshStats` garante que mana e ataque não permaneçam travados após resets de round.

### Statikk
Statikk é um personagem jogável registrado como `statikk`. Ele não usa mana para conjurar e conta ataques para periodicamente disparar uma corrente elétrica.

Quando o ataque configurado da sequência é alcançado, cria `LightningBolt`, dispara no alvo atual e reseta o contador. `refreshStats` também reseta o contador para não carregar progresso entre rounds.

### Vania
Vania é uma personagem jogável registrada como `vania`. Ela não usa mana para conjurar e conta ataques para periodicamente transformar seu projétil em `Silver Bolt`.

O disparo especial configura pipeline de luz, adiciona light vinculada ao projétil, aplica dano true no `onHit` e remove listener de update quando o projétil é destruído. `refreshStats` reseta o contador.

### Ymir
Ymir é um personagem jogável registrado como `ymir`. Ele possui passiva de congelar atacantes conforme chance configurada e uma habilidade ativa que emite uma onda congelante ao redor de si.

`castAbility` trava movimento durante a onda, congela inimigos atingidos, concede escudo ao resolver a habilidade e registra cleanup para mudança de `gamestate`. O listener de dano recebido é removido quando Ymir é destruído.

### Yue
Yue é uma personagem jogável registrada como `yue`, com os traits `Arcanist` e `Incendiary`. Ela usa os assets duplicados de Megumin como base visual, usa mana para conjurar sua habilidade e mantém um ataque básico à distância com `Fireball`.

A habilidade `Fire Ray` escolhe um inimigo ativo e alvejável aleatório, desenha uma linha de fogo reta de Yue até esse alvo e aplica dano de fogo ao final da animação. O dano passa pelo cálculo padrão de dano/crit do `Creature`. O raio é apenas visual, sem colisão física, e cria uma luz laranja pulsante equivalente ao perfil visual do `Fireball` enquanto cresce.

## Fixes
