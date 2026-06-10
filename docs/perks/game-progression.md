# Sistema de Meta-Progressão (Engine / Game)

Este documento detalha o funcionamento do sistema de progressão permanente (XP e Níveis) dos personagens fora das runs, influenciando os atributos e habilidades em jogo.

## 1. Constants e Fórmulas Configuráveis
Todas as variáveis de balanceamento estarão centralizadas em `src/game/systems/Progression/ProgressionConstants.ts`:
- `XP_PER_FLOOR_BASE`: Quantidade base de XP ganho por andar concluído (ex: 100).
- `XP_FLOOR_MULTIPLIER`: Fator de crescimento conforme os andares sobem (ex: 1.1 ou 1.2).
- `XP_REQUIREMENT_BASE`: XP necessário para passar do nível 1 para o 2 (ex: 500).
- `XP_REQUIREMENT_MULTIPLIER`: Fator de aumento de XP necessário por nível (ex: 1.5).

## 2. MetaProgressionRegistry
O arquivo `src/game/systems/Progression/MetaProgressionRegistry.ts` será responsável pela persistência no `localStorage`.
- **Estado Salvo**: `Record<string, { xp: number, level: number }>` mapeando o id/nome da classe do personagem (ex: "lizwan") para seu progresso.
- **`grantXpToBoard(scene: Game, floor: number)`**: Função chamada para distribuir XP. Ela itera sobre os personagens ativos no tabuleiro (excluindo o bench) e adiciona o XP calculado para cada um.

## 3. Hook de Experiência
Em `src/game/creature/character/PlayerTeam.ts`, no método `grantFloorReward(floor: number)`, chamaremos `MetaProgressionRegistry.grantXpToBoard(this.scene, floor)` para garantir que toda a equipe no tabuleiro seja recompensada com XP ao concluir um andar com sucesso.

## 4. O Sistema de Perks
- **`MetaPerk`**: Classe base com método `applyModifier(creature: Character)`.
- **`DefaultMetaPerk`**: Perk infinito de fallback (concede +5% AP, +5% Attack Damage, +5% Max Health). Utilizado sempre que o personagem não possuir um perk único mapeado para aquele nível específico.
- **`PerkRegistry`**: Registro estático que mapeia um personagem e um nível a um `MetaPerk` específico. (Ex: Lizwan, Nível 2 -> `DeadlyPoisonSpreadPerk`).
- **Ciclo de Vida do Character**: Em `Character.ts`, dentro do método `refreshStats()`, faremos uma chamada a `MetaProgressionRegistry.applyPerks(this)`. O registro aplicará os perks sequencialmente do nível 2 até o nível atual do personagem.