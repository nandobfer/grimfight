# SVG Spritesheets Vetoriais para Criaturas

Este documento define o formato obrigatorio para spritesheets SVG geradas por IA para personagens, monstros e outras criaturas do Grim Fight.

Leia este arquivo antes de criar ou alterar qualquer spritesheet SVG. O objetivo e produzir arquivos que o Phaser consiga carregar como spritesheet rasterizada e fatiar de forma previsivel com `frameWidth: 64` e `frameHeight: 64`.

## Objetivo

Use SVG como uma linguagem textual para criar assets visuais editaveis por IA, sem depender de artistas, ferramentas externas ou geradores binarios de imagem.

O SVG final deve funcionar como uma spritesheet tradicional. Depois do preload, o Phaser trata o SVG como textura rasterizada, entao cada celula precisa estar perfeitamente alinhada no grid.

## Regra Central

Nunca gere pixel art literal em SVG usando milhares de retangulos de `1x1`. Isso cria arquivos grandes, inconsistentes e dificeis de revisar.

Use sempre um estilo vetorial estilizado e modular:

- Formas vetoriais limpas (`path`, `circle`, `ellipse`, `rect`, `polygon`, `line`) com curvas e recortes quando melhorarem a silhueta.
- Camadas reutilizaveis para corpo, cabeca, cabelo, roupas, armadura, arma, acessorios, sombras, brilho e efeito principal.
- Paleta consistente com cores de base, sombra, highlight e acento visual.
- Silhueta clara em tamanho `64x64`, sem depender de microdetalhes para ser reconhecivel.
- Partes reutilizaveis em `<defs>` e instancias por frame usando `<use href="#...">` com `transform`.

## Estilo Visual

O objetivo nao e criar silhuetas pobres ou genericas. A IA pode usar mais elementos visuais, desde que eles sejam controlados, reutilizaveis e legiveis depois da rasterizacao pelo Phaser.

Permitido e recomendado quando ajudar a qualidade:

- `path` com curvas limpas para cabelo, capas, panos, chamas, fumaca, folhas, caudas, chifres, asas e monstros organicos.
- Strokes finos a moderados para contorno, separacao de planos e leitura de silhueta.
- Highlights, rim light, sombras internas, oclusao simples e pequenos brilhos de material.
- Gradientes lineares ou radiais simples para metal, magia, fogo, gelo, veneno, sombras e volume corporal.
- `clipPath` ou `mask` leves para limitar brilho, runas, padroes de tecido ou efeitos dentro de uma parte.
- Detalhes recorrentes como olhos, cicatrizes, dentes, runas, joias, fivelas, emblemas, placas de armadura, costuras, penas, folhas ou ossos.

Evite:

- Detalhes menores que 2 pixels quando rasterizados.
- Centenas de partes unicas por frame.
- Paths enormes e irrevisaveis que substituem a modularidade.
- Filtros pesados, blur grande, texturas complexas ou qualquer tecnica que trave o preload.

## Formato Obrigatorio do Arquivo

Todo SVG de criatura neste formato deve ter:

- Frame individual: `64x64` pixels.
- Colunas por linha: `9`.
- Linhas totais: `20`.
- Tamanho final: `576x1280` pixels.
- `viewBox="0 0 576 1280"`.
- Fundo transparente.
- Nenhuma animacao SVG runtime (`<animate>`, CSS animation, SMIL ou script).
- Nenhum texto visivel, label, numero de frame ou guia de grid renderizado.
- Nenhuma referencia externa a imagem, fonte, CSS remoto ou arquivo externo.

Exemplo de raiz:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="576" height="1280" viewBox="0 0 576 1280">
  <defs>
    <!-- Partes reutilizaveis do personagem entram aqui. -->
  </defs>

  <!-- Frames entram aqui em celulas 64x64. -->
</svg>
```

## Ordem das Direcoes

Para spritesheets SVG, a ordem das direcoes deve seguir exatamente o padrao atual de `Creature.extractAnimationsFromSpritesheet()`:

1. `up`
2. `left`
3. `down`
4. `right`

Nao use a ordem de atlas JSON como referencia para este formato. Este documento descreve uma spritesheet fatiada por indices numericos, nao um atlas JSON nomeado.

## Ordem das Animacoes

Toda spritesheet SVG padrao de criatura deve conter as animacoes abaixo, sempre nas quatro direcoes:

- `idle`: 2 frames por direcao.
- `walking`: 9 frames por direcao.
- `attacking1`: 8 frames por direcao.
- `attacking2`: 6 frames por direcao.
- `casting`: 7 frames por direcao.

Mesmo quando uma criatura usar apenas uma variante de ataque no codigo, a spritesheet padrao deve manter `attacking1` e `attacking2` para preservar compatibilidade e permitir variacao futura. Se uma classe especifica quiser uma animacao chamada apenas `attacking`, o codigo de extracao deve criar esse alias explicitamente. Nao mude o layout do SVG para acomodar esse caso.

## Mapa do Grid

O grid tem sempre 9 colunas. Cada linha tem altura 64. O indice de frame do Phaser e calculado assim:

```ts
frameIndex = row * 9 + column
```

Use este mapa sem excecoes:

| Linhas | Animacao | Direcao | Frames usados | Indice inicial | Colunas usadas |
| --- | --- | --- | --- | --- | --- |
| 0 | idle | up | 2 | 0 | 0-1 |
| 1 | idle | left | 2 | 9 | 0-1 |
| 2 | idle | down | 2 | 18 | 0-1 |
| 3 | idle | right | 2 | 27 | 0-1 |
| 4 | walking | up | 9 | 36 | 0-8 |
| 5 | walking | left | 9 | 45 | 0-8 |
| 6 | walking | down | 9 | 54 | 0-8 |
| 7 | walking | right | 9 | 63 | 0-8 |
| 8 | attacking1 | up | 8 | 72 | 0-7 |
| 9 | attacking1 | left | 8 | 81 | 0-7 |
| 10 | attacking1 | down | 8 | 90 | 0-7 |
| 11 | attacking1 | right | 8 | 99 | 0-7 |
| 12 | attacking2 | up | 6 | 108 | 0-5 |
| 13 | attacking2 | left | 6 | 117 | 0-5 |
| 14 | attacking2 | down | 6 | 126 | 0-5 |
| 15 | attacking2 | right | 6 | 135 | 0-5 |
| 16 | casting | up | 7 | 144 | 0-6 |
| 17 | casting | left | 7 | 153 | 0-6 |
| 18 | casting | down | 7 | 162 | 0-6 |
| 19 | casting | right | 7 | 171 | 0-6 |

As colunas nao usadas no fim de cada linha devem permanecer transparentes. Nao desenhe placeholders nelas.

## Contrato Futuro de Extracao no Phaser

Quando `SpritesheetCreatureVisualDefinition` for estendida para suportar SVG neste formato, a extracao esperada deve ser equivalente a:

```ts
creature.extractAnimationsFromSpritesheet("idle", 0, 2, 9)
creature.extractAnimationsFromSpritesheet("walking", 36, 9, 9)
creature.extractAnimationsFromSpritesheet("attacking1", 72, 8, 9)
creature.extractAnimationsFromSpritesheet("attacking2", 108, 6, 9)
creature.extractAnimationsFromSpritesheet("casting", 144, 7, 9)
```

O `totalFramesPerRow` deve ser `9`, nao `13`, para este formato SVG compacto.

## Estrutura Recomendada dos Frames

Cada frame deve ser uma celula SVG isolada. Prefira usar um elemento `<svg>` interno por celula em vez de um `<g>` solto, porque isso cria um viewport local `0 0 64 64` e reduz risco de vazamento visual para celulas vizinhas.

Formato recomendado:

```svg
<svg id="frame-idle-up-0" x="0" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
  <use href="#shadow" x="0" y="0" />
  <use href="#body" transform="translate(32 34)" />
  <use href="#head-up" transform="translate(32 20)" />
  <use href="#weapon" transform="translate(42 34) rotate(-10)" />
</svg>
```

Para calcular a posicao da celula:

```ts
x = column * 64
y = row * 64
```

Exemplos:

- `idle up frame 0`: `x="0"`, `y="0"`.
- `idle up frame 1`: `x="64"`, `y="0"`.
- `walking down frame 3`: linha `6`, coluna `3`, entao `x="192"`, `y="384"`.
- `casting right frame 6`: linha `19`, coluna `6`, entao `x="384"`, `y="1216"`.

## Uso Obrigatorio de `<defs>` e `<use>`

Defina partes reutilizaveis uma vez em `<defs>`. Frames devem principalmente posicionar, rotacionar, espelhar e variar essas partes. Pequenas variacoes por frame sao permitidas para smear, impacto, particulas ou expressao, mas a criatura base deve continuar vindo dos mesmos grupos canonicos.

Bom:

```svg
<defs>
  <radialGradient id="armor-shine" cx="35%" cy="20%" r="70%">
    <stop offset="0" stop-color="#a8b7ff" />
    <stop offset="1" stop-color="#4b5cc4" />
  </radialGradient>
  <ellipse id="shadow" cx="32" cy="56" rx="13" ry="4" fill="#000" opacity="0.25" />
  <g id="torso">
    <path d="M-10,-11 Q0,-15 10,-11 L8,12 Q0,16 -8,12 Z" fill="url(#armor-shine)" stroke="#26306f" stroke-width="1.5" />
    <path d="M-6,-8 Q0,-11 6,-8 L5,-2 Q0,1 -5,-2 Z" fill="#d9e2ff" opacity="0.45" />
    <circle cx="0" cy="2" r="2" fill="#f6d36b" />
  </g>
  <g id="head-down">
    <circle cx="0" cy="0" r="8" fill="#f0c38a" />
    <rect x="-4" y="2" width="8" height="2" rx="1" fill="#3a2418" />
  </g>
</defs>
```

Ruim:

```svg
<!-- Nao copie todo o personagem em path gigante para cada frame. -->
<path d="M...centenas de coordenadas..." />
```

## Ficha Visual Canonica

Antes de gerar a spritesheet completa, defina uma ficha visual curta e trate-a como contrato para todos os frames, direcoes, portrait e FX relacionados. A ficha nao precisa entrar no SVG final, mas deve guiar a criacao.

A ficha deve conter:

- Silhueta principal: alto, baixo, largo, magro, encapuzado, alado, quadrupede, arqueiro, mago, bruto etc.
- Proporcoes fixas: tamanho relativo de cabeca, torso, membros, arma, chifres, capa, cauda ou asas.
- Paleta: cor primaria, secundaria, sombra, highlight, contorno e cor de acento.
- Material dominante: pele, osso, metal, couro, tecido, cristal, madeira, energia, sombra, sangue etc.
- Direcao de luz padrao, preferencialmente vindo de cima/esquerda para manter highlights coerentes.
- Elemento iconico recorrente: runa, chama, folha, gema, olho, cicatriz, emblema, casco, espinhos, halo, fumaca etc.
- Assimetria intencional: ombro maior, chifre quebrado, arma em uma mao, olho brilhante, capa rasgada. Mantenha essa assimetria coerente entre direcoes; nao espelhe sem pensar.

## Consistencia Visual Obrigatoria

A mesma criatura deve parecer a mesma em todos os frames e direcoes. A IA deve tratar a spritesheet como animacao modular, nao como 128 desenhos independentes.

Regras obrigatorias:

- Mantenha a mesma paleta em todas as direcoes.
- Mantenha a mesma escala corporal em todas as linhas.
- Mantenha o pe/centro do personagem ancorado perto de `x=32`, `y=54`.
- Mantenha a cabeca, torso, arma e acessorios com tamanhos coerentes entre frames.
- Mude poses por `transform` e pequenas variacoes modulares, nao redesenhando completamente as partes.
- Mantenha highlights e sombras coerentes com a direcao de luz definida na ficha visual.
- Repita o elemento iconico da criatura nas direcoes onde ele deveria aparecer.
- Preserve diferencas entre materiais: metal deve ler diferente de tecido, couro, pele, osso ou magia.
- Evite detalhes abaixo de 2 pixels de espessura, pois o Phaser vai rasterizar o SVG.
- Use bordas ou contraste suficiente para a silhueta ser legivel em `64x64`.
- Garanta que armas, capas, efeitos e trails nao atravessem para celulas vizinhas.

## Direcoes e Silhueta

Cada direcao precisa comunicar claramente o lado para onde a criatura olha:

- `up`: rosto oculto ou minimo, arma/acessorios orientados para cima, costas ou nuca visivel.
- `left`: corpo levemente de perfil para a esquerda, arma apontando ou balancando para a esquerda.
- `down`: rosto frontal, torso e arma visiveis para o jogador.
- `right`: espelho coerente de `left`, mas nao dependa de `scale(-1, 1)` se isso inverter detalhes que deveriam permanecer assimetricos.

Se usar espelhamento, aplique ao grupo certo e reposicione para manter tudo dentro de `0..64`.

## Animacao por Acao

`idle` deve ser sutil. Use os 2 frames para respiracao, leve oscilacao vertical, brilho discreto ou micro movimento da arma.

`walking` deve ter 9 frames. Use ciclo claro de pernas/bracos com deslocamento minimo do corpo. O centro do personagem nao deve andar pela celula; a locomocao real e feita pelo Phaser.

`attacking1` deve ter 8 frames. Use antecipacao, golpe, impacto e recuperacao. O impacto visual obrigatorio deve acontecer no quinto frame da animacao, pois o adapter SVG usa esse frame como momento de aplicacao do ataque.

`attacking2` deve ter 6 frames. Use uma variacao distinta e mais curta, como estocada, golpe lateral, disparo rapido ou pancada secundaria. O impacto visual obrigatorio deve acontecer no quarto frame da animacao, pois o adapter SVG usa esse frame como momento de aplicacao do ataque.

`casting` deve ter 7 frames. Use preparacao, acumulacao, pico magico e dissipacao. Efeitos devem ser estilizados e coerentes com a criatura, como runas, arcos, raios curtos, particulas, fumaca, folhas, gelo, fogo, sangue, sombra ou brilho sagrado.

## Boas Praticas para IA Gerar o Arquivo

Ao gerar uma spritesheet SVG completa, siga este fluxo:

1. Defina uma ficha visual canonica da criatura: classe, silhueta, proporcoes, paleta, material, direcao de luz, arma, assimetria e efeito principal.
2. Crie primeiro `<defs>` com corpo, cabeca por direcao, cabelo/capuz/chifres, bracos, pernas, arma, sombra, highlights, detalhes recorrentes e efeitos basicos.
3. Crie todas as celulas de `idle` para validar escala e direcao.
4. Expanda para `walking`, reutilizando o mesmo corpo e alternando transforms de pernas/bracos.
5. Expanda para `attacking1` e `attacking2`, preservando ancoragem dos pes.
6. Expanda para `casting`, reutilizando efeitos definidos em `<defs>`.
7. Revise todos os `x` e `y` de celulas para garantir multiplos de `64`.
8. Revise se o root ainda tem `width="576"`, `height="1280"` e `viewBox="0 0 576 1280"`.

## Checklist Antes de Entregar um SVG

Antes de finalizar qualquer spritesheet SVG, confirme:

- O arquivo e um unico SVG valido.
- O root tem `width="576"`, `height="1280"` e `viewBox="0 0 576 1280"`.
- Cada frame visual fica dentro de uma celula `64x64`.
- Todas as celulas usadas tem `x` e `y` multiplos de `64`.
- A ordem de direcoes e `up`, `left`, `down`, `right`.
- Existem frames para `idle`, `walking`, `attacking1`, `attacking2` e `casting`.
- Cada animacao existe nas quatro direcoes.
- `attacking1` tem impacto visual no quinto frame e `attacking2` tem impacto visual no quarto frame.
- Nao ha labels, grades, numeros ou texto renderizado no asset.
- Nao ha `<animate>`, CSS animation, script ou referencia externa.
- O personagem e consistente entre todos os frames.
- A ficha visual canonica foi seguida em paleta, proporcao, materiais, luz, acessorios e elemento iconico.
- Colunas nao usadas permanecem transparentes.

## Observacoes de Performance

O Phaser rasteriza SVGs durante o carregamento. Portanto:

- Prefira detalhe controlado, modular e reutilizavel.
- Evite filtros SVG pesados, blur grande, gradientes complexos demais e paths enormes.
- Evite milhares de nodes ou centenas de elementos exclusivos por frame.
- Nao gere assets muito maiores que o necessario.
- Se a spritesheet ficar pesada ou travar o preload, simplifique formas e reduza detalhes.

## Exemplo de Esqueleto Compacto

Este exemplo nao e uma criatura completa. Ele mostra apenas a estrutura correta com camadas suficientes para orientar um asset mais rico sem abandonar modularidade.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="576" height="1280" viewBox="0 0 576 1280">
  <defs>
    <linearGradient id="blue-armor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fb0ff" />
      <stop offset="0.55" stop-color="#5368d9" />
      <stop offset="1" stop-color="#28336f" />
    </linearGradient>
    <radialGradient id="gold-rune" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#fff0a8" />
      <stop offset="1" stop-color="#d99a2b" />
    </radialGradient>
    <ellipse id="shadow" cx="32" cy="56" rx="13" ry="4" fill="#000" opacity="0.25" />
    <g id="body">
      <path d="M-10,-12 Q0,-16 10,-12 L8,12 Q0,16 -8,12 Z" fill="url(#blue-armor)" stroke="#1b214d" stroke-width="1.5" />
      <path d="M-6,-8 Q0,-11 6,-8 L4,-2 Q0,1 -4,-2 Z" fill="#dbe4ff" opacity="0.45" />
      <circle cx="0" cy="3" r="2.2" fill="url(#gold-rune)" stroke="#6b4216" stroke-width="0.6" />
    </g>
    <g id="head-down">
      <path d="M-8,-2 Q-7,-10 0,-11 Q7,-10 8,-2 Q8,7 0,9 Q-8,7 -8,-2 Z" fill="#f0c38a" stroke="#5b3722" stroke-width="1" />
      <path d="M-8,-3 Q0,-12 8,-3 Q3,-6 0,-5 Q-3,-6 -8,-3 Z" fill="#2a1a14" />
      <circle cx="-3" cy="-1" r="1" fill="#20150f" />
      <circle cx="3" cy="-1" r="1" fill="#20150f" />
    </g>
    <g id="sword">
      <path d="M0,-18 L3,4 L0,9 L-3,4 Z" fill="#d7e1ff" stroke="#647094" stroke-width="0.8" />
      <path d="M0,-15 L1,2" stroke="#ffffff" stroke-width="0.8" opacity="0.7" />
      <rect x="-5" y="5" width="10" height="2.5" rx="1" fill="#6b3f23" />
    </g>
  </defs>

  <svg id="frame-idle-up-0" x="0" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#shadow" />
    <use href="#body" transform="translate(32 36)" />
  </svg>

  <svg id="frame-idle-up-1" x="64" y="0" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#shadow" />
    <use href="#body" transform="translate(32 35)" />
  </svg>

  <svg id="frame-idle-down-0" x="0" y="128" width="64" height="64" viewBox="0 0 64 64" overflow="hidden">
    <use href="#shadow" />
    <use href="#body" transform="translate(32 36)" />
    <use href="#head-down" transform="translate(32 20)" />
    <use href="#sword" transform="translate(45 35) rotate(20)" />
  </svg>
</svg>
```
