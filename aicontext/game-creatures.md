# Game Creatures

## Features

### Rokmora
Rokmora é um personagem jogável registrado como `rokmora`, com os traits `Druid` e `Colossi`. Ele usa os atributos base de Lalatina para vida, ataque, velocidade e cadência, mas tem mana máxima zero e opera como personagem de habilidade passiva.

Durante o combate, Rokmora navega em ciclo pelas constelações `archer`, `dragon` e `chalice`, cada uma com duração de 5 segundos. A constelação do Arqueiro dispara uma flecha luminosa azul-violeta a partir do alvo atacado contra um inimigo próximo, causando `10%` da vida máxima de Rokmora mais `200%` do AP como dano radiante. A constelação do Dragão concede escudo ao receber dano, calculado pelo dano efetivamente recebido multiplicado pela armadura atual de Rokmora em percentual. A constelação da Taça pulsa uma aura verde a cada segundo, distribuindo `20%` da vida máxima de Rokmora como cura entre todos os aliados feridos, incluindo ele próprio.

As fórmulas puras da passiva ficam em `src/game/creature/classes/RokmoraConstellations.ts` para manter a regra testável sem instanciar Phaser.

## Fixes
