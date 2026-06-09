# Game Creatures

## Features

### Rokmora
Rokmora é um personagem jogável registrado como `rokmora`, com os traits `Druid` e `Colossi`. Ele usa os atributos base de Lalatina para vida, ataque, velocidade e cadência, mas tem mana máxima zero e opera como personagem de habilidade passiva.

Durante o combate, Rokmora navega em ciclo pelas constelações `archer`, `dragon` e `chalice`, cada uma com duração de 5 segundos. A constelação do Arqueiro dispara uma flecha luminosa azul-violeta a partir do alvo atacado contra um inimigo próximo, causando `10%` da vida máxima de Rokmora mais `200%` do AP como dano radiante. A constelação do Dragão concede escudo ao receber dano, calculado pelo dano efetivamente recebido multiplicado pela armadura atual de Rokmora em percentual. A constelação da Taça pulsa uma aura verde a cada segundo, distribuindo `20%` da vida máxima de Rokmora como cura entre todos os aliados feridos, incluindo ele próprio.

As fórmulas puras da passiva ficam em `src/game/creature/classes/RokmoraConstellations.ts` para manter a regra testável sem instanciar Phaser.

### Yue
Yue é uma personagem jogável registrada como `yue`, com os traits `Arcanist` e `Incendiary`. Ela usa os assets duplicados de Megumin como base visual, tem 50 de mana máxima e mantém um ataque básico à distância com `Fireball`.

A habilidade `Fire Ray` escolhe um inimigo ativo e alvejável aleatório, desenha uma linha de fogo reta de Yue até esse alvo por 500ms e aplica dano de fogo ao final da animação. O dano base é `50%` do AP de Yue e passa pelo cálculo padrão de dano/crit do `Creature`. O raio é apenas visual, sem colisão física, e cria uma luz laranja pulsante equivalente ao perfil visual do `Fireball` enquanto cresce.

## Fixes
