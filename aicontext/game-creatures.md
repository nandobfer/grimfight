# Game Creatures

## Features

### Archer
Archer é um personagem jogável registrado como `laherce`. Ele mantém ataque básico à distância usando `Arrow` e sua habilidade dispara uma rajada em cone na direção do alvo atual ou da direção em que está virado.

A habilidade cria projéteis independentes, configura o dano no `onHit` de cada flecha e usa o cálculo padrão de dano do `Creature`. A regra deve permanecer na classe do personagem e nos projéteis, sem mover a lógica de combate para UI.

### Arthas
Arthas é um personagem jogável registrado como `arthas`, ligado às identidades de nobreza, gelo e morte. Ele possui lifesteal passivo e uma sequência de conjurações de `Frost Strike` que alterna entre golpe no alvo, golpe em área frontal e pilares de gelo em inimigos.

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

### Clover
Clover é um personagem jogável registrado como `clover`, ligado às identidades de atacante e feitiçaria. Ele atua como lutador corpo a corpo híbrido, usando ataques físicos e uma habilidade de corte sombrio que escala com o dano de ataque atual.

Ao conjurar `Dark Cleave`, Clover mantém o alvo atual ou retargeta pelo fluxo padrão, calcula uma direção frontal com pequena variação aleatória e garante que a linha resultante ainda atravesse o alvo escolhido. O corte é desenhado com `Graphics` como energia preta com contorno e brilho vermelho escuro, avança a partir de Clover e atravessa inimigos, causando dano sombrio uma única vez por inimigo atingido. Um hitbox físico acompanha a ponta do corte para encerrar o efeito ao colidir com as paredes da arena, enquanto a colisão de dano usa interseção do segmento visual para evitar tunneling e manter o alvo principal dentro da área.

O FX deve limpar gráfico, hitbox, luz, timer, collider e listeners de update/gamestate quando terminar, bater em parede, mudar de rodada, Clover morrer ou o alvo original sair de cena. A fórmula pura de dano e helpers de geometria ficam em `src/game/creature/classes/CloverDarkCleave.ts` para permitir testes sem carregar Phaser.

### Dracula
Dracula é um personagem jogável registrado como `dracula`. Ele possui lifesteal passivo, observa a morte do alvo atual e ganha benefício de sustain/ofensivo quando esse alvo morre.

A habilidade ativa troca o alvo para um inimigo de menor vida e modifica temporariamente o próximo ataque para aplicar dano sombrio adicional. Observers de morte são removidos em `refreshStats`, ao trocar de alvo ou quando o personagem é destruído.

### Dranho
Dranho é um personagem jogável registrado como `dranho`, ligado às identidades de arcano e cleric. Ele não usa ataques básicos, mana ou o evento `cast`; em vez disso, permanece canalizando enquanto houver um alvo válido em alcance.

A canalização causa dano periódico no alvo atual usando uma contribuição do AP do próprio Dranho e uma contribuição agregada do AP dos aliados ativos do time principal, sem contar Dranho e sem incluir summons/minions. O efeito visual é desenhado com `Graphics` persistente como energia roxa fluindo desses aliados válidos até Dranho, energia convergindo nele e feixes em arco até o alvo, e deve limpar o gráfico ao perder alvo, sair de combate, resetar stats ou destruir o personagem.

### Helyna
Helyna é uma personagem jogável registrada como `helyna`, ligada ao druidismo. Ela usa a habilidade `Druidism` para alternar entre forma humana, urso ou gato conforme a posição inicial.

Na posição traseira, Helyna não se transforma. Ela mantém ataque à distância e conjura curas em sequência, priorizando aliados feridos diferentes quando possível. Cada cura combina `Regrowth`, uma cura imediata, e `Rejuvenation`, um `Hot` no mesmo alvo.

Na posição frontal, Helyna assume temporariamente a forma de urso. A transformação aumenta seus atributos defensivos e ofensivos, preserva a proporção de vida ao entrar e sair da forma, troca mana por rage e aplica `Regrowth` com `Rejuvenation` em si mesma após ganhar a vida máxima da forma. Em forma de urso, o ataque básico é substituído por um cleave físico em área usando o envelope visual do corte de Fandral sem efeitos elementais adicionais. Quando ferida e com rage suficiente, ela usa `Regeneração Frenética` para aplicar um `Hot` em si mesma.

Na posição central, Helyna assume temporariamente a forma de gato. A transformação preserva a proporção de vida ao entrar e sair da forma, troca mana por energy, salta para perto do alvo sem causar dano inicial e usa `Rake` apenas quando está corpo a corpo. `Rake` consome energy, respeita cooldown próprio, desenha uma mordida com `Graphics` e aplica um `Dot` físico severo.

`refreshStats` retorna Helyna para a forma humana, remove timers de transformação, restaura caches de atributos, reseta recursos temporários e garante que a barra volte para mana. O nome de textura/animação deve refletir a forma ativa.

### Frank
Frank é um personagem jogável registrado como `frank`. Ele não usa mana para conjurar e possui uma passiva que conta ataques para periodicamente drenar vida do alvo.

Quando o ataque configurado da sequência é alcançado, `drainLife` aplica dano venenoso calculado pela regra atual e cura Frank com base no resultado. `refreshStats` reseta o contador para evitar acúmulo indevido entre rounds.

### Fandral
Fandral é um personagem jogável registrado como `fandral`, ligado a fogo, druidismo e assassinato. Ele permanece em forma felina, emite uma luz fraca e constante de fogo, e usa uma habilidade de corte flamejante em área fixa ao redor do alvo atual.

A habilidade calcula uma linha curta de células centrada no alvo e perpendicular à direção de Fandral, então usa uma margem expandida ao redor dessa faixa para desenhar o efeito. O dano usa o envelope completo do visual animado e interseção com o corpo do inimigo, para que inimigos visualmente sobrepostos pelo corte também sejam afetados. O visual aparece diretamente nessa área como marcas de garra feitas com `Graphics`, sem projétil saindo do personagem. Inimigos na área recebem dano direto de fogo e um `Dot` de burning com fonte separada para damage chart. O FX deve limpar tween, gráfico e listener de estado ao terminar ou ao mudar a rodada.

Se o alvo atual de Fandral ficar inválido no momento do cast, ele tenta retargetar para outro inimigo ativo. Quando o novo alvo está fora de alcance, Fandral salta para perto dele com tween e então executa o corte normalmente. Se não houver nenhum alvo válido, o cast aborta sem emitir gatilhos de cast nem reembolsar mana cheia, evitando reentrância de traits e saltos repetidos.

### Freud
Freud é um personagem jogável registrado como `freud`. Ele não usa mana para conjurar e possui duas passivas: uma de retarget corpo a corpo quando inimigos entram em alcance adjacente, e outra de dano sombrio adicional em críticos.

Ao entrar em combate, Freud observa movimento dos inimigos para tentar retarget imediato. Ao sair de combate, fazer refresh ou destruir o personagem, remove todos os observers registrados. Em críticos, `SoulKnife` aplica o dano normal e, se o alvo continuar ativo, aplica dano sombrio adicional e concede escudo baseado no dano efetivamente causado.

### Lalatina
Lalatina é uma personagem jogável registrada como `lalatina`. Ela arremessa `HolyShield` no alvo atual e aplica um voto adicional conforme sua posição inicial.

Na posição frontal, concede escudo a aliados próximos. Na posição do meio, configura o escudo para critar e aplicar burn. Na posição traseira, cura o aliado de menor vida. Sua passiva aplica uma aura de time por posição e substitui a aura anterior quando a posição muda.

Ao destruir Lalatina, a aura ativa deve ser removida do time. `applyAura` é responsável por remover aura antiga, criar a aura correta, adicionar ao time e atualizar stats do grupo.

### Lizwan
Lizwan é um personagem jogável registrado como `lizwan`. Ele aplica veneno a cada ataque e usa mana para catalisar venenos ativos no alvo atual.

`landAttack` preserva o ataque base, cria feedback visual de veneno e aplica um `Dot` do tipo poison no alvo atual. O status carrega usuário, alvo e nome da habilidade para integração com damage chart e cleanup do sistema de status.

Ao conjurar, Lizwan soma o dano bruto restante dos `Dot` poison ativos no alvo atual e aplica uma parcela desse potencial como dano poison imediato creditado a uma fonte separada da passiva no damage chart. Se o alvo estiver inválido ou não houver veneno restante, o cast aborta sem emitir gatilhos de conjuração.

### Lucio
Lucio é um personagem jogável registrado como `lucio`, ligado a veneno e morte. Ele atua como caster venenoso de ataques lentos: ataques básicos não causam dano instantâneo padrão, mas lançam uma bolha venenosa lenta contra o alvo atual.

Cada bolha venenosa é um projétil desenhado com `Graphics`, usando um hitbox físico mínimo, luz própria e rastro pegajoso temporário. Ao colidir com um inimigo, a bolha aplica um `Dot` poison que escala com AP de Lucio e credita o dano no damage chart como fonte de ataque básico. Ao colidir com parede ou terminar seu ciclo, limpa gráficos, rastro, listener de update, luz, tween e colliders pelo fluxo de `Projectile`.

Ao conjurar `Poison Nova`, Lucio dispara bolhas venenosas simultâneas ao redor de si. As bolhas da habilidade usam a mesma regra de dano das bolhas de ataque básico, mas creditam o `Dot` no damage chart como fonte da habilidade para manter a leitura separada.

### Nala
Nala é uma personagem jogável registrada como `nala`, ligada a veneno e ataque. Ela usa ataque básico à distância com `Arrow`, participa das traits `Poisoner` e `Attacker`, e usa spritesheet SVG e portrait WebP próprios.

Ao conjurar `Serpent Volley`, Nala cria cobras venenosas desenhadas com `Graphics` e hitboxes próprios. As cobras saem em direções aleatórias, ignoram paredes e colidem apenas com inimigos e minions inimigos. Depois de uma curta janela inicial, cada cobra passa a perseguir sempre o alvo atual de Nala; se ela trocar de alvo, as cobras ajustam o homing para o novo alvo válido. Se não houver alvo válido, o efeito encerra com cleanup.

Ao colidir, cada cobra causa dano venenoso direto e aplica um `Dot` poison. Tanto o impacto quanto o dano ao longo do tempo escalam com AD e AP atuais de Nala para preservar sua identidade híbrida. Cobras, gráficos, hitboxes, overlaps, timers e listeners de update/gamestate limpam ao acertar, expirar, sair de combate, resetar stats ou destruir Nala. As fórmulas puras da habilidade ficam em `src/game/creature/classes/NalaSerpents.ts` para permitir testes sem carregar Phaser.

### Mage
Mage é uma personagem jogável registrada como `megumin`. Ela usa `Fireball` no ataque básico e sua habilidade causa explosão de fogo no alvo atual.

`castAbility` calcula dano pelo fluxo padrão do `Creature`, aplica dano fire ao alvo e cria `Explosion` para afetar inimigos adjacentes conforme a implementação do FX/sistema. `refreshStats` inicializa mana conforme a regra atual da personagem.

### Knight
Knight é um personagem jogável registrado como `maximus`. Sua habilidade cria um escudo mágico em si mesmo e trava mana enquanto o escudo existir.

`castAbility` cria `MagicShieldFx`, chama `gainShield` com a fórmula atual da classe e registra listener de `shield-broken` para destravar mana. O teste desse contrato deve focar no estado de mana e no registro do listener, não no valor do escudo.

### Melo
Melo é um personagem jogável registrado como `melo`. Ele usa `Holybolt` no ataque básico e sua habilidade cura aliados priorizando os que têm menor proporção de vida.

`castAbility` ordena aliados pela fração de vida, cura os alvos selecionados com o cálculo padrão e cria `HolyHeal` para feedback visual. `refreshStats` inicializa mana conforme a regra atual do personagem.

### Melisandre
Melisandre é uma personagem jogável registrada como `melisandre`, ligada às identidades de suporte, cleric e incendiary. Ela usa `Fireball` no ataque básico à distância e começa o combate com mana inicial pelo fluxo padrão de ganho de mana.

Sua habilidade escolhe aliados ativos priorizando menor proporção de vida e resolve empates por ordem aleatorizada. Os aliados afetados recebem um status temporário de fortalecimento flamejante que aumenta a cadência de ataques e faz ataques causarem dano adicional de fogo atribuído à Melisandre. O status também controla o visual de aura flamejante em `Graphics` e limpa bônus, listeners e desenho ao expirar, quando o alvo sai de combate ou quando a rodada termina.

### Jacrost
Jacrost é um personagem jogável registrado como `jacrost`, ligado às identidades de suporte, neve e controle. Ele usa `Snowball` no ataque básico à distância e participa das traits `Cleric` e `Winter`.

Sua habilidade `Geada Protetora` cria uma rajada visual de névoa, neve e vento atravessando o board. No meio da animação, aliados ativos recebem escudo calculado pelo fluxo padrão de dano do caster para preservar AP atual, variação e crítico, enquanto inimigos ativos recebem `Freeze` temporário. O FX deve limpar graphic, tween e listeners ao completar, ao ser interrompido por mudança de estado ou quando Jacrost deixa o combate.

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

### Robilton
Robilton é um personagem jogável registrado como `robilton`, ligado às identidades de arqueiro arcano e atacante veloz. Ele usa ataque básico à distância com projétil desenhado em `Graphics`, participa das traits `Arcanist` e `Swift`, e usa os assets próprios de spritesheet SVG e portrait WebP.

Cada ataque aplica um Orbe de Gravidade ao alvo atingido. Os orbes não possuem limite máximo de stacks e são renderizados por um `Graphics` persistente como esferas roxas orbitando cada inimigo afetado. O estado dos orbes é limpo quando o alvo morre ou é destruído, quando Robilton reseta, quando a rodada sai de combate ou quando Robilton é destruído.

A habilidade `Estrela de Nêutrons` canaliza uma estrela roxa crescente por uma janela que diminui conforme a velocidade de ataque atual de Robilton. Ao fim da conjuração, se o alvo original não estiver mais válido, Robilton retargeta antes de disparar. A estrela é lançada como projétil gráfico com rastro, explode ao colidir, causa dano sombrio em área, detona apenas os Orbes de Gravidade dos inimigos atingidos pela explosão e cria um buraco negro temporário centrado no impacto. O buraco negro puxa todos os inimigos ativos do tabuleiro em direção ao centro com força total, sem tratamento especial para monstros grandes ou bosses.

Todos os efeitos de Robilton são desenhados com `Phaser.GameObjects.Graphics`. Projéteis, hitboxes, tweens, timers e listeners de update/gamestate devem limpar explicitamente ao terminar, mudar a rodada, resetar stats ou destruir o personagem. As fórmulas puras de tempo de conjuração, dano, raio e força ficam em `src/game/creature/classes/RobiltonNeutronStar.ts` para manter a regra testável sem instanciar Phaser.

### Saulo
Saulo é um personagem jogável registrado como `saulo`, ligado às identidades de veneno e resistência colossal. Ele usa spritesheet SVG e portrait WebP próprios, nunca executa ataques básicos e transforma movimento em fonte principal de pressão no combate.

Durante combate, Saulo mira sempre o inimigo válido mais distante. Quando alcança distância corpo a corpo, atravessa a célula do alvo até a borda oposta antes de trocar novamente para o inimigo mais distante. Se restar apenas um alvo válido, ele patrulha entre bordas opostas da célula desse alvo para atravessá-lo repetidamente e cobrir a área com veneno.

Saulo não desvia de outras criaturas e pode atravessar unidades livremente, mas continua respeitando os limites da arena. Enquanto se move, emite nuvens temporárias de gás venenoso desenhadas com `Graphics`; inimigos dentro dessas nuvens recebem ou renovam um `Dot` venenoso creditado a Saulo, permitindo integração com damage chart e traits acionadas por dano causado.

Ao conjurar, Saulo aplica `Hot` em si mesmo, recebe aumento temporário de velocidade e provoca o alvo atual usando o contrato de taunt da criatura. Nuvens de gás, timers de velocidade, referências de patrulha e efeitos temporários devem limpar ao sair de combate, resetar stats ou destruir o personagem.

### Silvia
Silvia é uma personagem jogável registrada como `silvia`, ligada a magia arcana, feitiçaria e resistência colossal. Ela atua como tanque conjuradora de linha de frente, usando correntes mágicas para proteger aliados pressionados e manipular alvo inimigo.

Sua passiva converte AP atual em vida máxima e vida máxima atual em AP usando os atributos externos aos bônus da própria passiva, evitando retroalimentação entre as duas conversões. A passiva é sincronizada durante combate para que AP ou vida máxima recebidos por traits, itens, augments ou outros efeitos atualizem os bônus já aplicados sem resetar a criatura. A habilidade procura o inimigo que está atacando o aliado ativo mais ferido; se nenhum inimigo estiver pressionando outro aliado, escolhe o inimigo válido mais distante. Recasts adicionais da habilidade devem priorizar inimigos ainda não escolhidos na sequência atual, mas podem repetir alvos quando todos os inimigos válidos já foram escolhidos.

Ao conjurar, Silvia lança duas correntes roxas desenhadas com `Graphics` em trajetórias curvas e perseguidoras. As correntes colidem somente com o alvo escolhido, causam dano sombrio, puxam esse alvo para a frente de Silvia e usam o contrato reutilizável de taunt da criatura para forçar o alvo a atacá-la. Hitboxes, gráficos, listeners, timers e tweens criados pela habilidade devem limpar ao atingir, ao mudar de estado, ao resetar stats ou ao destruir Silvia.

As fórmulas puras da passiva, dano e geometria ficam em `src/game/creature/classes/SilviaChains.ts` para manter a regra testável sem instanciar Phaser.

### Ragnaros
Ragnaros é um personagem jogável registrado como `ragnaros`, ligado a fogo, arcano e resistência colossal. Ele usa habilidade passiva, mantém mana travada para não conjurar pelo fluxo padrão e preserva mana máxima apenas como integração com efeitos que leem esse atributo.

Ao receber dano em combate, Ragnaros pode retaliar com um cone de lava na direção do atacante. A retaliação define temporariamente o atacante como alvo atual e emite `cast`, permitindo que Incendiary e itens acionados por conjuração resolvam pelo mesmo contrato dos demais personagens. Em seguida, inimigos ativos dentro do cone recebem dano de fogo baseado no AP atual de Ragnaros.

O cone e o efeito constante de lava derretendo são desenhados com `Graphics`. O cone é temporário e limpa tween e gráfico ao terminar ou mudar o estado da rodada. A lava constante acompanha o personagem em `update`, reutiliza gotículas internas em vez de criar objetos por quadro e destrói o gráfico junto com Ragnaros.

As fórmulas e a geometria pura da passiva ficam em `src/game/creature/classes/RagnarosLavaRetaliation.ts` para manter a regra testável sem instanciar Phaser.

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

O disparo especial configura pipeline de luz, adiciona light vinculada ao projétil, aplica dano true no `onHit`, encaminha a vítima real pelo fluxo de acerto do personagem e remove listener de update quando o projétil é destruído. `refreshStats` reseta o contador.

### Ymir
Ymir é um personagem jogável registrado como `ymir`. Ele possui passiva de congelar atacantes conforme chance configurada e uma habilidade ativa que emite uma onda congelante ao redor de si.

`castAbility` trava movimento durante a onda, congela inimigos atingidos, concede escudo ao resolver a habilidade e registra cleanup para mudança de `gamestate`. O listener de dano recebido é removido quando Ymir é destruído.

### Yue
Yue é uma personagem jogável registrada como `yue`, com os traits `Arcanist` e `Incendiary`. Ela usa os assets duplicados de Megumin como base visual, usa mana para conjurar sua habilidade e mantém um ataque básico à distância com `Fireball`.

A habilidade `Fire Ray` escolhe um inimigo ativo e alvejável aleatório, define esse inimigo como alvo atual da Yue para manter traits acionadas por cast alinhadas ao mesmo alvo, desenha uma linha de fogo reta até ele e aplica dano de fogo ao final da animação. O dano passa pelo cálculo padrão de dano/crit do `Creature`. O raio é apenas visual, sem colisão física, e cria uma luz laranja pulsante equivalente ao perfil visual do `Fireball` enquanto cresce.

## Fixes
