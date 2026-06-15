# Spritesheets SVG para Partículas e Efeitos (FX)

Para efeitos visuais (classes estendendo `FxSprite` como `LeavesFx.ts`) e projéteis (classes estendendo `Projectile` como `Fireball.ts`), o formato da spritesheet é simplificado e linear.

### Regras para FX e Projéteis

- **Frame individual:** `64x64` pixels.
- **Linhas e Colunas:** 1 linha única com 10 colunas (10 frames).
- **Tamanho final:** `640x64` pixels.
- **ViewBox:** `viewBox="0 0 640 64"`.
- **Orientação Direcional:** Projéteis e efeitos que possuem direção (como flechas ou bolas de fogo) devem SEMPRE ser desenhados apontando para a **direita** (0 graus no Phaser). A engine fará a rotação matemática correta no jogo (`setRotation()`).
- O fundo deve ser transparente e o mesmo estilo vetorial estilizado modular de `docs/svg-spritesheets.md` se aplica.

### Estilo Visual para FX e Projéteis

FX e projéteis nao devem parecer apenas circulos ou retangulos genericos. Use camadas para criar uma leitura clara do elemento, mantendo o SVG leve e previsivel.

Use quando ajudar a identidade do efeito:

- Nucleo principal, brilho externo, highlight interno, trail, particulas secundarias e dissipacao.
- `path` com curvas limpas para chamas, fumaca, folhas, sangue, sombra, vento, raios e magia organica.
- Gradientes simples para calor, gelo, veneno, luz, energia arcana ou metal brilhante.
- Strokes, opacidades e pequenas particulas para dar velocidade, impacto e direcao.
- `clipPath` ou `mask` leves para controlar brilhos e recortes.

Evite:

- Filtros pesados, blur grande, texturas complexas e milhares de nodes.
- Detalhes abaixo de 2 pixels que viram ruido ao rasterizar.
- Frames que parecem efeitos diferentes em vez de etapas do mesmo efeito.
- Trails ou particulas que vazem para fora da celula `64x64`.

### Consistencia de Animacao

Os 10 frames devem contar uma progressao visual coerente:

- Para FX de impacto: antecipacao ou surgimento, expansao, pico, fragmentacao e dissipacao.
- Para projeteis em loop: forma estavel, pulsacao, deslocamento interno de particulas e trail recorrente, sem mudar a silhueta principal.
- Para efeitos elementais: preserve o mesmo motivo visual durante todos os frames, como lingua de fogo, cristal de gelo, bolha venenosa, folha cortante, raio serrilhado, gota de sangue ou chama sombria.

Quando o FX pertence a uma criatura especifica, use a mesma paleta, elemento iconico e direcao de luz da ficha visual canonica da criatura.

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

Um esqueleto típico de projétil/FX usa deslocamento apenas em `x`, aumentando de 64 em 64. Mesmo um exemplo compacto deve separar nucleo, brilho, trail e particulas:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="64" viewBox="0 0 640 64">
  <defs>
    <radialGradient id="fire-core-gradient" cx="62%" cy="48%" r="60%">
      <stop offset="0" stop-color="#fff6a8" />
      <stop offset="0.45" stop-color="#ff9f1a" />
      <stop offset="1" stop-color="#d93212" />
    </radialGradient>
    <g id="fire-core">
      <path d="M18,32 C18,20 28,13 36,10 C33,18 48,20 48,34 C48,45 39,52 28,50 C20,48 16,41 18,32 Z" fill="url(#fire-core-gradient)" />
      <path d="M28,37 C27,30 34,25 38,21 C37,29 43,31 41,39 C39,45 31,47 28,37 Z" fill="#fff2b8" opacity="0.8" />
    </g>
    <g id="fire-trail">
      <path d="M8,34 C16,25 25,25 34,31 C24,35 18,42 9,43 Z" fill="#ff4b1f" opacity="0.45" />
      <path d="M4,29 C12,27 18,29 24,33 C16,34 10,37 5,39 Z" fill="#ffb347" opacity="0.35" />
    </g>
    <g id="sparks">
      <circle cx="12" cy="21" r="1.6" fill="#ffd166" />
      <circle cx="17" cy="47" r="1.2" fill="#ff7a1a" />
      <circle cx="51" cy="25" r="1.4" fill="#fff0a8" />
    </g>
  </defs>

  <!-- Frame 0 -->
  <svg id="fx-frame-0" x="0" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#fire-trail" opacity="0.55" />
    <use href="#fire-core" transform="translate(-2 0) scale(0.9)" transform-origin="32 32" />
    <use href="#sparks" opacity="0.55" />
  </svg>

  <!-- Frame 1 -->
  <svg id="fx-frame-1" x="64" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#fire-trail" transform="translate(-2 0) scale(1.1 1)" transform-origin="32 32" opacity="0.65" />
    <use href="#fire-core" transform="scale(1.05)" transform-origin="32 32" />
    <use href="#sparks" transform="translate(2 -1)" opacity="0.7" />
  </svg>

  <!-- ... Frames 2 a 8 ... -->

  <!-- Frame 9 -->
  <svg id="fx-frame-9" x="576" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#fire-trail" transform="translate(4 0) scale(0.8)" transform-origin="32 32" opacity="0.4" />
    <use href="#fire-core" transform="scale(0.85)" transform-origin="32 32" opacity="0.75" />
    <use href="#sparks" transform="translate(5 -2)" opacity="0.4" />
  </svg>
</svg>
```
