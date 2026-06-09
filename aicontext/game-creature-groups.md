# Game Creature Groups

## Features

### CreatureGroup
`CreatureGroup` é a base de grupos de combatentes. Ele gerencia criaturas principais, minions opcionais, augments e auras compartilhadas.

`getChildren` pode incluir minions e filtrar apenas criaturas ativas. `add` vincula a criatura ao grupo como seu time. `reset` reseta criaturas, recalcula stats do grupo e limpa minions para evitar sobras entre rounds.

`clear` destrói UI de criaturas e sprites de itens antes de limpar o grupo. O grupo também oferece busca por posição, busca por célula, verificação de wipe e seleção do aliado com menor fração de vida.

Ao receber augment, o grupo registra o floor atual, adiciona o augment, aplica feedback visual nas criaturas, reseta o time e salva progresso. Auras são removidas com cleanup aplicado em criaturas ativas antes de sair do set do grupo.

### PlayerTeam
`PlayerTeam` é o grupo do jogador. Ele estende `CreatureGroup` e mantém `DamageChart`, `Bench`, `CharacterStore` e traits ativas.

Ao adicionar personagem, o time preserva posições salvas quando existem, ou posiciona o personagem no grid do jogador quando necessário. Depois tenta merge, reseta estado, salva personagens e emite o array atualizado para a UI.

Merges só acontecem fora de `fighting`. O fluxo escolhe um keeper, consome donors com animação, move itens dos donors para o board, sobe o nível do keeper, recalcula traits, refresca stats, salva e emite estado.

O time salva personagens por DTO, remove personagens inválidos do board, controla benching, calcula se o board está cheio, emite augments e recalcula traits a partir de personagens únicos via `TraitsRegistry`.

Recompensas de vitória e consolação delegam ganho de gold à cena e renovam a loja, sem fixar fórmulas no contexto.

### EnemyTeam
`EnemyTeam` é o grupo de monstros do encounter atual. Ele especializa `CreatureGroup` para retornar filhos como monstros.

Ao resetar, executa o reset base, reposiciona monstros no tabuleiro conforme `preferredPosition` e reposiciona itens equipados. O posicionamento separa front, middle e back e evita mover monstros para linhas do jogador.

Ao receber augment, aplica o fluxo base, chama `onPick` no time inimigo e emite eventos específicos para a UI de augments inimigos.

### Character
`Character` é a base de personagens jogáveis. Ele estende `Creature`, adiciona badge de nível, DTO de persistência, drag and drop, integração com `EventBus`, bench, shopkeeper, tavern e persistência local.

`refreshStats` protege contra reentrada, reseta a criatura e reaplica itens, traits, augments e auras na ordem própria dos personagens. `loadFromDto` restaura nível, posição, crit multiplier e itens pelo registry de itens, depois reaplica comportamento dependente de posicionamento.

Drag and drop só deve operar no estado `idle`. O personagem mostra overlays e feedback de shopkeeper/tavern, emite eventos para o overlay React, usa `AbortController` para listeners globais de pointer e limpa esses listeners no fim do drag e no destroy.

`getDto` centraliza o formato salvo do personagem. Equipar e desequipar itens atualiza itens disponíveis na cena, personagens salvos e progresso. `onBenchDrop` move itens para o board, destrói o personagem do board, recalcula traits e salva/emite o estado do time.

### Bench
`Bench` mantém DTOs de personagens fora do board e persiste esse estado em `localStorage`.

`save`, `load`, `clear` e `emit` mantêm armazenamento local e UI sincronizados. `add` salva o DTO, verifica possibilidade de level up combinando bench e board, e resolve o fluxo com summon ou criação de DTO evoluído conforme a composição atual.

`summon` recria personagem pelo `CharacterRegistry`, adiciona ao `PlayerTeam`, remove do bench e emite seleção. `sell` calcula reembolso via loja, atualiza gold na cena e remove o DTO.

### CharacterStore
`CharacterStore` mantém a loja local de personagens. Ela carrega itens salvos, gera novos DTOs por `CharacterRegistry.random`, usa o nível mais alto entre board e bench como entrada de progressão e salva/emite a loja.

`buy` impede compra de item já vendido, cobra gold, marca o item como vendido, adiciona o personagem ao bench e pode invocar automaticamente quando há espaço no board e a cena está em `idle`.

`sell` reembolsa pela regra atual da loja, destrói o personagem vendido, reseta o time, remove do bench e salva o board. `getMatchingCharacter` procura ofertas equivalentes ignorando itens vendidos e o próprio item.

## Fixes
