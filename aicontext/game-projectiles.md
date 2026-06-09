# Game Projectiles

## Features

### Projectile Lifecycle And Safety
A classe base `Projectile` estende Arcade Sprite e ignora a gravidade. Ela assegura que um mesmo alvo não receba danos múltiplos no mesmo frame de sobreposição mantendo um conjunto `alreadyOverlaped`. Se viajar além de seu tempo de vida útil ou limites, um timer de `watchdog` promove a autodestruição. 
Seu `destroy` é explícito e garante a limpeza de timers, tweens, luzes (`lights`) e colliders.

### Combat Resolution
Projéteis transferem a responsabilidade do cálculo final e da emissão de acerto para o atirador original através da chamada a `owner.onAttackLand(damageType, target)`. Acertos em paredes desencadeiam efeitos visuais de parede através da cena.

### Types Of Projectiles
*   **Linear:** Disparos de linha reta (`Arrow`, `Fireball`, `IceShard`, etc.) voam até o alvo ou limite. Variam majoritariamente em velocidade, animação, tipo de dano e iluminação.
*   **Bounce:** Projéteis saltitantes (`LightningBolt`, `HolyShield`) controlam ricochetes varrendo os remanescentes em `getRemainingTargets()` após o impacto, redirecionando o voo para o inimigo ativo mais próximo, diminuindo o número de bounces. `LightningBolt` em particular aplica decréscimo ao seu poder a cada ricochete sucessivo.
*   **Status Imbuement:** Alguns projéteis aplicam debuffs paralelos ao acerto. Por exemplo, versões aprimoradas do `HolyShield` geram e aplicam um `Dot` passivo nos alvos atingidos.

## Fixes
