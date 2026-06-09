# Game Traits

## Features

### Arcanist
Arcanist é uma trait jogável registrada como `Arcanist`, composta por `freud` e `yue`. A trait aparece para personagens da composição, mas só fica ativa quando o time possui personagens únicos suficientes para alcançar seus estágios.

Quando a trait alcança seus estágios ativos, cada unidade Arcanist ganha AP durante o combate. O ganho usa timer por unidade, varia conforme o estágio ativo e só acumula enquanto a cena está no estado `fighting`.

### Incendiary
Incendiary é uma trait jogável registrada como `Incendiary`, composta por `banguela`, `megumin` e `yue`. Ao alcançar estágio ativo, personagens Incendiary aplicam queimadura ao alvo atual quando castam suas habilidades, usando dano baseado no estágio, floor atual e mana máxima do caster.

### Trait
`Trait` é a base de sinergias de composição. Ela mantém composição válida, stages, composição ativa e stage ativo. `startApplying` calcula personagens ativos da composição, `tryApply` executa cleanup antes de aplicar modificador e `getActiveStage` escolhe o stage disponível pela composição atual.

### TraitsRegistry
`TraitsRegistry` registra traits por nome e composição, cria instâncias, restaura dados serializados, lista entries e calcula traits aplicáveis a uma composição de personagens únicos.

### Attacker
Attacker é uma trait de personagens ofensivos. Quando ativa, aplica bônus de ataque conforme stage atual.

### Assassin
Assassin é uma trait de personagens assassinos. Quando ativa, registra comportamento em evento de kill e limpa o listener ao reaplicar ou destruir a criatura.

### Cleric
Cleric é uma trait de suporte. Quando ativa, escuta mortes no time para acionar cura e remove o listener no cleanup.

### Colossi
Colossi é uma trait de personagens resistentes. Quando ativa, aplica bônus defensivos conforme stage atual.

### Deatheater
Deatheater é uma trait de personagens ligados a morte e revive. Quando ativa, escuta morte da criatura, executa revive condicional em combate e limpa listener e estado interno no cleanup.

### Druid
Druid é uma trait de personagens druídicos. Quando ativa, aplica bônus de stats conforme composição atual.

### Holy
Holy é uma trait de personagens sagrados. Quando ativa, escuta casts e aplica cura ou shield conforme stage atual, removendo listener no cleanup.

### Noble
Noble é uma trait de personagens nobres. Quando ativa, escuta kills para conceder bônus temporários e remove listener no cleanup.

### Pack
Pack é uma trait de personagens de matilha. Quando ativa, escuta dano causado para aplicar efeito adicional e remove listener no cleanup.

### Popsicle
Popsicle é uma trait de personagens de gelo. Quando ativa, escuta dano causado para aplicar freeze ou efeito frio conforme stage atual e remove listener no cleanup.

### Sorcerer
Sorcerer é uma trait de conjuradores. Quando ativa, escuta casts para agendar efeito adicional e remove listener no cleanup.

### Swift
Swift é uma trait de personagens rápidos. Quando ativa, aplica bônus de velocidade ou attack speed conforme stage atual.

## Fixes
