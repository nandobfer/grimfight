# Game Artifact Items

Este documento detalha o comportamento dos Artefatos do jogo, equipamentos extremamente poderosos ou únicos. Todos estes itens precisam ser adequadamente desvinculados via método `cleanup`.

## Features

### Gatilhos de Cast (`cast`)
Artefatos que reagem diretamente sempre que o portador usa uma habilidade.
*   **Dawncore:** Irradia mana ou cura para aliados ao redor após a conjuração de uma habilidade, suportando formações de equipe próximas.
*   **InnervatingLocket:** Após cada uso de habilidade, o portador recupera pequenas parcelas vitais e energéticas.
*   **LichBane:** Intercepta o callback padrão do próximo ataque base (`onAttackLand`), convertendo e aplicando bônus massivos de dano mágico baseado no poder de habilidade no hit imediato após a magia.
*   **LudensTempest:** A conjuração lança um feixe de dano encadeado ou projéteis explodindo, atingindo o alvo e dividindo o impacto entre os adversários circundantes.
*   **Manazane:** Concede recuperação hiper-acelerada de um pool de mana gigantesco logo após o cast, permitindo disparar magias seguidas em uma janela de tempo estreita.

### On-Hit / Ativos no Ataque (`afterAttack`)
Modificam substancialmente o fluxo após o impacto do ataque.
*   **FlickerBlade:** Cada ataque executado reduz severamente o tempo de recarga ou acelera a recuperação do limite necessário para o próximo uso da habilidade.
*   **TitanicHydra:** Deriva uma parcela da barra de vida do usuário em forma de dano de dispersão para as posições adjacentes do alvo primário, transformando tanks em dano de área.
*   **WitsEnd:** Ao atingir o oponente, soma dano mágico puro, e simultaneamente rouba / incrementa a taxa de defesa mágica em cada golpe.

### Gatilhos de Abate ou Limiares Letais (`kill` / `dealt-damage`)
Artefatos que modificam a letalidade.
*   **GoldCollector:** Se o dano aplicar contra o alvo deixar sua vitalidade restante abaixo do threshold estrito do item, executa imediatamente a unidade; cada execução provê ouro adicional ao jogador.
*   **ProwlersClaw:** No abate, o portador instantaneamente realiza um dash / teleport para a retaguarda do próximo inimigo na fila, garantindo bônus efêmero de velocidade ou dano letal.
*   **SeekersArmGuard:** Ao participar do abatimento de oponentes, adquire permanentemente frações de proteção vital ao longo da runa atual.

### Manipulação de Shield (`gain-shield`, `shield-broken`)
*   **UnendingDespair:** Assina os eventos exclusivos de escudo e quebra de escudo. Na quebra, emite um estopim em área (AoE) que inflige dano aos próximos e drena parte desse acerto curando diretamente o usuário.

### Stats Complexos e Evolução Temporal
*   **TalismanOfAscension:** Quanto mais tempo o usuário sobrevive ao round, mais atributos ocultos se empilham até cruzar a linha da "ascensão", curando todos em volta e elevando seu status passivamente em níveis extremos.
*   **RapidFireCannon:** Concede ganho colossal no atributo de raio de alcance do disparo (Attack Range) impedindo com que ataques fiquem fora de distância, frequentemente combinado com bônus fixos pesados.
*   **Hullcrusher:** Identifica via posicionamento solitário no layout do board a ausência de aliados em casas adjacentes. Se for o caso, escala drasticamente blindagem e força contusiva.
*   **TrinityForce:** Eleva exponencialmente em formato distribuído todas as sub-estatísticas essenciais, criando a figura do combatente híbrido universal.

## Fixes
