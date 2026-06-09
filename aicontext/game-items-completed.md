# Game Completed Items

Este documento detalha o comportamento dos itens completos no jogo, focando em suas mecânicas e gatilhos, sem definir valores numéricos de balanceamento.

## Features

### Stats Puros (Sem Eventos Especiais)
Itens desta categoria apenas aumentam atributos vitais de forma direta.
*   **Adaptivehelm:** Aumenta resistência mágica.
*   **Bluebuff:** Reduz limite máximo de mana e concede mana inicial e regen.
*   **Deathblade:** Concede attack damage massivo.
*   **Evenshroud:** Reduz a armadura dos inimigos próximos via aura.
*   **Gargoylestoneplate:** Aumenta resistências com base na quantidade de inimigos focando o portador.
*   **Giantslayer:** Aumenta o dano causado contra alvos com saúde total elevada.
*   **Handofjustice:** Fornece um misto de dano, poder de habilidade e roubo de vida.
*   **Infinityedge:** Aumenta dano e chance de acerto crítico.
*   **Ionicspark:** Reduz a resistência mágica de inimigos próximos via aura e causa dano quando conjuram habilidades.
*   **Jeweledgauntlet:** Permite que habilidades causem acerto crítico e aumenta poder mágico.
*   **Lastwhisper:** Reduz armadura de inimigos ao aplicar dano físico.
*   **Quicksilver:** Fornece imunidade a controles de grupo no começo do combate.
*   **Rabadon:** Fornece um multiplicador maciço de poder de habilidade.
*   **Shojin:** Restaura mana adicional a cada ataque básico.
*   **Strikersflail:** Aumenta os stats brutos ofensivos.
*   **Warmog:** Concede um ganho maciço de vida máxima.

### On-Hit / Ativos no Ataque (`afterAttack`)
Estes itens escutam os ataques do portador e disparam efeitos adicionais na finalização do ataque. Todo item desta categoria desvincula o listener no cleanup.
*   **Guinsoo:** Acumula indefinidamente velocidade de ataque adicional a cada golpe.
*   **Krakenslayer:** A cada número específico de ataques consecutivos, o golpe causa dano verdadeiro adicional.
*   **Nashor:** Quando o portador ataca, recebe bônus ou engatilha um efeito específico de velocidade temporária.
*   **Voidstaff:** Rouba mana do alvo atacado e concede ao atacante, atrasando os casts do inimigo.

### Reativos à Tomada de Dano (`damage-taken`)
Escutam o recebimento de dano para engatilhar sobrevivência ou retaliação. Requerem cleanup do evento.
*   **Bloodthirster:** Quando a vida cai abaixo de um limiar crítico pela primeira vez, gera um grande escudo protetor. Além disso, concede roubo de vida passivamente.
*   **Bramblevest:** Reflete dano mágico de volta ao agressor sempre que o usuário recebe ataques diretos, além de prover armadura massiva.
*   **Nightedge:** Ao cruzar um limite crítico de vida inferior, limpa foca de inimigos (agro) e concede um breve instante de invisibilidade ou intocabilidade.
*   **Steadfastheart:** Bloqueia acertos críticos inimigos ou concede redução maciça de dano quando o agressor atende aos critérios do item.
*   **Sterak:** Semelhante à mecânica de limiar crítico, porém ao invés de apenas um escudo, infla os pontos vitais e tamanho do personagem de forma drástica para sobrevivência em combate corpo a corpo.
*   **Sunfire:** Aplica uma penalidade de debuff de queimadura (Dot) aos inimigos que estão atacando ou em volta do portador.
*   **Titanresolve:** Cada vez que recebe dano ou ataca, acumula bônus defensivos e ofensivos até um limite, que ao ser alcançado expande a resistência.

### Reativos a Causar Dano (`dealt-damage`)
Itens ativados pelo evento de dano finalizado do portador.
*   **Hextechgunblade:** Adiciona lifesteal nas habilidades; todo dano também cura passivamente o aliado mais ferido no board.
*   **Morello:** Aplica Queimadura e debuff de redução de cura nos inimigos que sofrem o dano do portador.
*   **Redbuff:** Análogo ao Morello, mas orientado ao ataque físico; atinge os alvos com a penalidade contínua de queimadura.

### Gatilhos de Início de Round (`gamestate`)
Itens que injetam lógicas específicas quando o round sai de "idle" para "fighting".
*   **Crownguard:** No momento do start do combate, envolve o portador num escudo temporário que escala com seu poder.
*   **Protectorsvow:** Analisa a posição do portador ou do aliado mais próximo no início e engatilha auras/escudos emergenciais.
*   **Thiefsgloves:** Escuta as transições de round. Consome inteiramente as mãos do portador, impedindo outros itens, e a cada início de round sorteia temporariamente itens completos novos, que são destruídos ao retornar para idle.

### Especiais de Duração e Limpeza (`destroy` único)
Embora todos os itens chamem cleanup no destroy, estes focam em acúmulos progressivos.
*   **Archangelstaff:** Ao longo da passagem de tempo contínua no combate, o poder de habilidade do portador escala infinitamente.
*   **Dragonclaw:** Proporciona defesa mágica gigantesca e periodicamente regenera parcela do dano sofrido ou vida máxima.
*   **Spiritvisage:** Aumenta passivamente toda cura recebida e adiciona regeneração de vida contínua a cada segundo.

## Fixes
