# Creature Visuals Procedurais com Phaser Graphics

Este documento define o padrao obrigatorio para criaturas do Grim Fight cujo visual e gerado por codigo com `Phaser.Graphics`, sem spritesheet PNG ou SVG externo.

Leia este arquivo antes de criar ou alterar qualquer personagem, monstro ou outra criatura usando textura procedural, visual procedural ou Graphics do Phaser.

## Objetivo

Use `Phaser.Graphics` como uma ferramenta de autoria procedural para gerar texturas compartilhadas em runtime. O resultado final ainda deve ser uma criatura baseada em `Phaser.Physics.Arcade.Sprite`, compativel com combate, fisica, drag-and-drop, animacoes, `postFX`, `Light2D`, barras de vida e sistemas existentes.

## Regra Central

Nao use `Graphics` como objeto persistente da criatura.

Use `Graphics` somente para desenhar frames em `preload()` e chamar `generateTexture()`. Depois de gerar as texturas, destrua o `Graphics` temporario. A criatura em jogo continua sendo um `Sprite` normal.

Motivo: `Creature` depende de `Sprite` para `anims`, `play`, eventos de animacao, fisica Arcade, input, `postFX`, tint, pipeline, escala, rotacao e depth.

## Contrato Tecnico

Use `ProceduralCreatureVisualDefinition` em `src/game/creature/visual/ProceduralCreatureVisualDefinition.ts`.

O adapter gera texturas individuais para cada frame e cria animacoes Phaser com as mesmas keys que `Creature` ja espera.

Exemplo de registro de monstro:

```ts
MonsterRegistry.register(
    "slime",
    Slime,
    true,
    new ProceduralCreatureVisualDefinition({
        textureKey: "slime",
        drawFrame: drawSlimeFrame,
    })
)
```

O `textureKey` da config e o prefixo estavel das texturas geradas. Para a criatura `slime`, o adapter gera keys como:

```text
slime-idle-down-0
slime-idle-down-1
slime-walking-left-0
slime-attacking1-right-4
slime-casting-up-6
```

## Contrato de Animacoes

Todo visual procedural de criatura deve criar as animacoes abaixo, sempre nas quatro direcoes:

- `idle`: 2 frames por direcao.
- `walking`: 9 frames por direcao.
- `attacking1`: 8 frames por direcao.
- `attacking2`: 6 frames por direcao.
- `casting`: 7 frames por direcao.

Direcoes obrigatorias:

- `up`
- `left`
- `down`
- `right`

As keys finais de animacao devem seguir exatamente este formato:

```text
<creature.name>-<animation>-<direction>
```

Exemplos:

```text
slime-idle-down
slime-walking-left
slime-attacking1-right
slime-casting-up
```

## Frames de Impacto

O momento visual do golpe deve respeitar o contrato de ataque usado por `Creature.startAttack()`:

- `attacking1`: impacto no quinto frame da animacao.
- `attacking2`: impacto no quarto frame da animacao.

O frame de impacto deve ser visualmente claro: extensao maxima, compressao brusca, brilho, smear, mordida, pancada, jato ou pico de energia.

## Tamanho e Ancoragem

Cada textura procedural deve ser desenhada em um frame de `64x64` por padrao.

Regras obrigatorias:

- Fundo transparente.
- Centro visual perto de `x=32`.
- Base, sombra ou ponto de contato perto de `y=54`.
- A criatura deve caber dentro do frame em todas as poses.
- Ataques, brilhos e trails nao devem ser cortados de forma grosseira.
- A escala corporal deve permanecer consistente entre animacoes e direcoes.

## API de Desenho

A funcao `drawFrame` recebe um contexto com:

```ts
interface ProceduralCreatureFrameContext {
    scene: Phaser.Scene
    graphics: Phaser.GameObjects.Graphics
    textureKey: string
    action: "idle" | "walking" | "attacking1" | "attacking2" | "casting"
    direction: "up" | "left" | "down" | "right"
    frame: number
    frameCount: number
    width: number
    height: number
}
```

Use esse contexto para calcular pose, offset, squash/stretch, brilho, sombras e detalhes direcionais.

## Estrutura Recomendada do Codigo

Mantenha a criatura, o painter e constantes visuais proximos entre si quando o visual for especifico daquela criatura.

Exemplo de organizacao:

```ts
const drawSlimeFrame: ProceduralCreatureFramePainter = ({ graphics, action, direction, frame, frameCount }) => {
    const progress = frameCount <= 1 ? 0 : frame / (frameCount - 1)
    const pulse = Math.sin(progress * Math.PI * 2)
    const facingOffset = direction === "left" ? -3 : direction === "right" ? 3 : 0

    graphics.fillStyle(0x000000, 0.25)
    graphics.fillEllipse(32, 56, 30, 8)

    graphics.fillStyle(0x38d889, 0.95)
    graphics.fillEllipse(32 + facingOffset, 38 + pulse, 34 + pulse * 2, 26 - pulse * 2)

    graphics.fillStyle(0xa7ffd1, 0.75)
    graphics.fillEllipse(25 + facingOffset, 31 + pulse, 10, 6)
}
```

Evite espalhar varios painters genericos sem necessidade. Se o painter so serve para uma criatura, mantenha-o junto do arquivo da criatura ou perto do registro que o usa.

## Estilo Visual

Use formas grandes, legiveis e com boa silhueta em `64x64`.

Recomendado:

- Elipses sobrepostas para corpo, sombra, volume e highlights.
- Paths simples para deformacao organica, gosma, chama, cauda, chifre, cristal ou boca.
- Camadas de cor para simular luz, sombra, rim light e material transluzente.
- Squash/stretch por `action` e `frame`.
- Pequena assimetria para dar personalidade.
- Diferenca clara entre direcoes usando olhos, brilho frontal, sombra traseira, antenas, boca ou deslocamento do corpo.

Evite:

- Microdetalhes menores que 2 pixels.
- Muitos elementos por frame.
- Recalcular geometrias caras em `update`.
- Criar uma textura unica por instancia de criatura quando todas podem compartilhar as mesmas texturas.
- Usar imagens externas dentro do painter.

## Animacao por Acao

`idle` deve ser sutil: respiracao, pulsacao, brilho, bolhas internas ou oscilacao vertical.

`walking` deve sugerir locomocao sem deslocar a criatura pela textura. Use squash lateral, compressao vertical, ondulacao, passos ou fluxo interno. A movimentacao real e feita pelo Phaser.

`attacking1` deve ter antecipacao, extensao, impacto e recuperacao. O quinto frame deve ser o mais forte.

`attacking2` deve ser uma variacao curta. O quarto frame deve ser o mais forte.

`casting` deve comunicar acumulacao e liberacao de poder. Use brilho, runas simples, bolhas, faiscas, aura, vapor, folhas, gelo, fogo, veneno ou sombra conforme a criatura.

## Direcoes

Mesmo criaturas amorfas devem comunicar direcao:

- `up`: olhos reduzidos ou ausentes, costas, brilho traseiro, nuca, espinhos ou sombra frontal menor.
- `left`: olhos/boca/acento deslocados para a esquerda.
- `down`: face frontal mais clara e expressiva.
- `right`: olhos/boca/acento deslocados para a direita.

Nao e obrigatorio redesenhar tudo para cada direcao, mas a leitura de facing precisa ser clara durante combate.

## Performance e Cleanup

Regras obrigatorias:

- Gere texturas em `preload()`, nao durante `update()`.
- Verifique `scene.textures.exists(textureKey)` antes de gerar uma textura.
- Verifique se a animacao ja existe antes de chamar `anims.create()`.
- Destrua o `Graphics` temporario depois de gerar os frames.
- Nao crie timers, tweens, listeners, particles ou lights dentro do painter.
- Nao use o painter para regra de jogo; ele deve desenhar apenas o frame visual.

## Checklist Antes de Entregar

Antes de finalizar uma criatura procedural, confirme:

- Foi usado `ProceduralCreatureVisualDefinition`.
- `Graphics` e usado apenas para gerar texturas, nao como criatura persistente.
- O painter gera frames transparentes de `64x64`.
- Existem `idle`, `walking`, `attacking1`, `attacking2` e `casting`.
- Todas as animacoes existem em `up`, `left`, `down` e `right`.
- O impacto visual de `attacking1` esta no quinto frame.
- O impacto visual de `attacking2` esta no quarto frame.
- A criatura fica visualmente ancorada perto de `x=32`, `y=54`.
- O visual permanece consistente entre frames e direcoes.
- Texturas e animacoes nao sao recriadas sem necessidade.
- Nenhuma regra de combate, progressao, itemizacao ou balanceamento foi movida para o painter.
