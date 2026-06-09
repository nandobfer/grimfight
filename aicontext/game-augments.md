# Game Augments

## Features

### Augment
`Augment` é a base de modificadores escolhidos durante a run. Ele mantém nome, descrição, floor escolhido, valores tokenizados para UI e cor de raridade.

Augments podem aplicar modificadores em criaturas por `applyModifier` ou executar efeitos imediatos no time por `onPick`. Efeitos que alteram progresso devem passar pela cena e sistemas existentes de persistência local.

### AugmentsRegistry
`AugmentsRegistry` centraliza augments disponíveis. Ele registra classes, cria instâncias por chave, restaura dados serializados, lista entradas e sorteia augments respeitando exclusões.

### Stat Augments
Augments de stats modificam atributos de criaturas quando o time reaplica augments. Eles devem manter a lógica em `src/game`, usar valores tokenizados para descrição e não criar estado persistente sem cleanup.

Augments documentados: AttackerAugment, BattlemageAugment, BonusHealthAugment, CasterAugment, ColossusAugment, CriticalAugment, DevastatorAugment, DexterousAugment, LifedrinkerAugment, PowerfulAugment, SniperAugment.

### Economy And Item Augments
Augments de economia e itemização executam efeitos quando escolhidos. Eles podem alterar gold, vidas, spawnar itens, abrir escolhas de anvil ou entregar artifacts e itens completos.

Augments documentados: AnvilAugment, ArtifactAndCompletedAnvilAugment, BonusGoldAugment, ItemAugment.

### Anvil Flow
Augments de anvil geram opções data-only pelo `ItemRegistry` e emitem evento para a UI escolher uma opção. A escolha final deve voltar para a cena como intenção simples e spawnar item localmente.

## Fixes
