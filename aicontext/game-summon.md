# Game Summon

## Features

### Summon
`Summon` cria minions inimigos ou aliados a partir de chaves do `MonsterRegistry`. O summon recebe master, entra no grupo de minions do time do master, aparece em ponto próximo ao caster e usa `MagicCircleFx` como feedback visual.

O summon copia posição de board do master, recebe ajustes opcionais de stats, scale e speed, executa reset, aplica auras e herda o alvo atual do master. O método retorna a criatura invocada para integrações como traits ou efeitos adicionais.

## Fixes
