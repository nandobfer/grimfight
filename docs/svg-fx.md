# Spritesheets SVG para Partículas e Efeitos (FX)

Para efeitos visuais (classes estendendo `FxSprite` como `LeavesFx.ts`) e projéteis (classes estendendo `Projectile` como `Fireball.ts`), o formato da spritesheet é simplificado e linear.

### Regras para FX e Projéteis

- **Frame individual:** `64x64` pixels.
- **Linhas e Colunas:** 1 linha única com 10 colunas (10 frames).
- **Tamanho final:** `640x64` pixels.
- **ViewBox:** `viewBox="0 0 640 64"`.
- **Orientação Direcional:** Projéteis e efeitos que possuem direção (como flechas ou bolas de fogo) devem SEMPRE ser desenhados apontando para a **direita** (0 graus no Phaser). A engine fará a rotação matemática correta no jogo (`setRotation()`).
- O fundo deve ser transparente e a mesma geometria minimalista e regras de `<defs>` das criaturas se aplicam.

### Integração com o Phaser e as Classes

No código, esse SVG será carregado no `preload` como uma spritesheet com `frameWidth: 64` e `frameHeight: 64`.

O caminho padrão de integração é registrar o SVG em `EffectVisualRegistry`, usando `SvgSpritesheetEffectVisualDefinition`. O preload da cena chama esse registry automaticamente, então um novo SVG não precisa ser adicionado manualmente em `Preloader.loadParticles()` quando estiver registrado.

Exemplo de registro para um FX único:

```ts
import { SvgSpritesheetEffectVisualDefinition } from "./SpritesheetEffectVisualDefinition"

EffectVisualRegistry.register("leaves", SvgSpritesheetEffectVisualDefinition.fx("leaves"))
```

Exemplo de registro para um projétil em loop:

```ts
import { SvgSpritesheetEffectVisualDefinition } from "./SpritesheetEffectVisualDefinition"

EffectVisualRegistry.register("fireball", SvgSpritesheetEffectVisualDefinition.projectile("fireball"))
```

Ao criar o `FxSprite`, a classe base consulta o registry pelo nome do `sprite`. Se encontrar uma definição registrada, a animação será configurada lendo todos os 10 frames (do 0 ao 9), iterando sobre a única linha do asset:

```ts
export class LeavesFx extends FxSprite {
    constructor(scene: Game, x: number, y: number, scale = 0.75) {
        super(scene, x, y, "leaves", scale)
    }
}
```

Para projéteis, passe `autoPlayVisual: true` e `flipX: false` no construtor base. O `flipX: false` preserva o contrato do SVG direcional apontando para a direita:

```ts
export class Fireball extends Projectile {
    constructor(scene: Game, x: number, y: number, owner: Creature) {
        super(scene, x, y, owner, "fireball", "fire", {
            autoPlayVisual: true,
            flipX: false,
        })
    }
}
```

Internamente, a definição registrada cria uma animação equivalente a:

```ts
scene.anims.create({
    key: "nome-do-efeito",
    frames: scene.anims.generateFrameNumbers("spritesheet-do-efeito", { start: 0, end: 9 }),
    frameRate: 15,
    repeat: 0,
})
```

Use `SvgSpritesheetEffectVisualDefinition.projectile()` para projéteis contínuos, pois ele define `repeat: -1` por padrão. Use `SvgSpritesheetEffectVisualDefinition.fx()` para efeitos que devem completar uma vez e chamar o cleanup normal de `FxSprite`.

### Exemplo de Esqueleto Mínimo para FX

Um esqueleto típico de projétil/FX usa deslocamento apenas em `x`, aumentando de 64 em 64:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="64" viewBox="0 0 640 64">
  <defs>
    <!-- Partes do efeito, ex: centro do fogo, particulas secundárias -->
    <circle id="core" cx="32" cy="32" r="12" fill="#ffaa00" />
  </defs>

  <!-- Frame 0 -->
  <svg id="fx-frame-0" x="0" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#core" />
  </svg>

  <!-- Frame 1 -->
  <svg id="fx-frame-1" x="64" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#core" transform="scale(1.2)" transform-origin="32 32" />
  </svg>

  <!-- ... Frames 2 a 8 ... -->

  <!-- Frame 9 -->
  <svg id="fx-frame-9" x="576" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#core" transform="scale(0.5)" transform-origin="32 32" opacity="0.5" />
  </svg>
</svg>
```
