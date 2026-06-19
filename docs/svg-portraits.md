# Portraits SVG Vetoriais para Criaturas

Este documento define o formato obrigatorio para a criacao de retratos (portraits) em SVG gerados por IA para personagens, monstros e outras entidades de Grim Fight. Os portraits sao usados na UI do jogo e os arquivos finais devem ficar na pasta `public/assets/portraits/`.

Leia este arquivo antes de criar ou alterar qualquer portrait.

## Regras de Imagem e Enquadramento

- **Tamanho exato:** O portrait deve ter sempre `64x64` pixels.
- **Enquadramento base:** Mostre apenas do torso para cima (cabeca e ombros). O personagem deve ocupar bastante o quadrado `64x64`, com a menor quantidade possivel de espaco vazio ao redor.
- **Escala e margens:** Enquadre a silhueta de forma grande e legivel, mantendo cabeca, ombros, arma ou acessorio principal proximos das bordas sem cortar elementos importantes. Evite retratos pequenos centralizados com muito fundo transparente.
- **Destaques e armas:** Se o usuario descrever algum elemento no prompt ao solicitar o portrait (ex: uma espada flamejante, um chifre quebrado, segurando um livro), esse elemento deve estar em destaque no enquadramento, preferencialmente proximo ao rosto ou peito.
- **Sem destaques:** Se o usuario nao pedir nenhum detalhe especifico, desenhe apenas meio torso e a cabeca do personagem em uma pose passiva e clara.

## Estilo Visual

- **Vetorial estilizado modular:** Siga o mesmo estilo de `docs/svg-spritesheets.md`. Use formas vetoriais limpas, camadas reutilizaveis e detalhes controlados, nao silhuetas pobres ou genericas.
- **Sem Pixel Art Literal:** Nao gere milhares de retangulos de `1x1` simulando pixel art. Use vetores grandes e formas solidas.
- **Legibilidade:** Lembre-se que o retrato ainda aparecera pequeno na UI. Cores contrastantes, formas bem definidas e silhueta grande dentro do `64x64` sao cruciais.
- **Fundo:** O fundo deve ser obrigatoriamente transparente. Não desenhe formas de fundo (como `rect` ocupando todo o espaço) cobrindo o `viewBox`.

Use mais elementos quando eles melhorarem identidade visual:

- Cabelo, capuz, chifres, orelhas, barba, cicatrizes, olhos brilhantes, dentes, penas, folhas, joias, runas, placas de armadura, fivelas e emblemas.
- Strokes, highlights, sombras internas, rim light e oclusao simples para separar planos.
- Gradientes simples para metal, tecido, pele, osso, cristal, fogo, gelo, veneno, sombra ou energia magica.
- `clipPath` ou `mask` leves para limitar brilhos, padroes de tecido, runas ou reflexos dentro do personagem.

Evite detalhes abaixo de 2 pixels, filtros pesados, blur grande, paths enormes e qualquer elemento que vire ruido quando convertido para `64x64` WebP.

## Consistencia com a Criatura

Quando o portrait representar uma criatura que tambem possui spritesheet, ele deve seguir a mesma ficha visual canonica descrita em `docs/svg-spritesheets.md`.

O portrait deve preservar:

- Mesma paleta primaria, secundaria, sombra, highlight e cor de acento.
- Mesmo formato de cabeca, cabelo, capuz, chifres, olhos, mascara ou rosto.
- Mesmo material dominante de roupa, armadura, pele, osso, couro, tecido ou energia.
- Mesmo elemento iconico: runa, gema, chama, folha, cicatriz, halo, olho brilhante, arma ou simbolo.
- Mesma direcao de luz e contraste geral.
- Mesma assimetria intencional, como chifre quebrado, ombro maior, olho diferente, capa rasgada ou arma em uma mao.

O portrait pode ter mais detalhe que a spritesheet porque e uma imagem estatica, mas nao deve contradizer a silhueta, a paleta ou os elementos reconheciveis da unidade em combate.

## Estrutura do SVG

Todo portrait em SVG gerado deve conter:

- `width="64"`
- `height="64"`
- `viewBox="0 0 64 64"`
- O conteudo deve estar totalmente contido ou clipado nesse viewBox.

Exemplo de base:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="armor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fb0ff" />
      <stop offset="1" stop-color="#28336f" />
    </linearGradient>
  </defs>
  <!-- Corpo e ombros, com fundo transparente -->
  <path d="M14,60 Q32,42 50,60 Z" fill="url(#armor)" stroke="#1b214d" stroke-width="2" />
  <!-- Cabeca, cabelo/capuz e detalhe iconico -->
  <path d="M18,28 Q20,9 32,8 Q44,9 46,28 Q44,43 32,47 Q20,43 18,28 Z" fill="#f0c38a" stroke="#5b3722" stroke-width="1.5" />
  <path d="M18,25 Q25,6 32,8 Q39,6 46,25 Q39,17 32,18 Q25,17 18,25 Z" fill="#2a1a14" />
  <circle cx="32" cy="38" r="3" fill="#f6d36b" />
</svg>
```

## Fluxo Obrigatorio para a IA

Sempre que solicitado a criar um portrait, siga exatamente estes passos:

1. Se existir spritesheet ou descricao visual da criatura, identifique a ficha visual canonica: paleta, silhueta, material, luz, elemento iconico e assimetria.
2. Gere o codigo SVG do portrait de acordo com a descricao do usuario, garantindo que o viewBox seja `0 0 64 64` e que o personagem ocupe bem o enquadramento.
3. Revise se o retrato continua reconhecivel como a mesma criatura da spritesheet, sem mudar paleta, rosto, materiais ou elemento iconico.
4. Salve o SVG no disco temporariamente.
5. **Converta o SVG para WebP.** O jogo carrega `.webp` em `public/assets/portraits/`. A IA deve usar o `sharp-cli` via `pnpm` (ex: `pnpm dlx sharp-cli`) para converter a imagem final para `.webp`. Nao use `npx`, `npm` ou `yarn`. A conversao deve preservar o tamanho de `64x64` sem distorcer.
6. Salve ou mova o arquivo convertido para `public/assets/portraits/<nome>.webp`.
7. Apague o arquivo `.svg` temporario e qualquer arquivo temporario criado no processo, incluindo scripts auxiliares usados para gerar o SVG, scripts de conversao, rascunhos e imagens intermediarias. O repositorio guarda os portraits apenas no formato WebP pronto para o jogo.
