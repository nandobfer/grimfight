# Portraits SVG Geometricos para Criaturas

Este documento define o formato obrigatorio para a criacao de retratos (portraits) em SVG gerados por IA para personagens, monstros e outras entidades de Grim Fight. Os portraits sao usados na UI do jogo e os arquivos finais devem ficar na pasta `public/assets/portraits/`.

Leia este arquivo antes de criar ou alterar qualquer portrait.

## Regras de Imagem e Enquadramento

- **Tamanho exato:** O portrait deve ter sempre `64x64` pixels.
- **Enquadramento base:** Mostre apenas do torso para cima (cabeca e ombros). O personagem deve ocupar bastante o quadrado `64x64`, com a menor quantidade possivel de espaco vazio ao redor.
- **Escala e margens:** Enquadre a silhueta de forma grande e legivel, mantendo cabeca, ombros, arma ou acessorio principal proximos das bordas sem cortar elementos importantes. Evite retratos pequenos centralizados com muito fundo transparente.
- **Destaques e armas:** Se o usuario descrever algum elemento no prompt ao solicitar o portrait (ex: uma espada flamejante, um chifre quebrado, segurando um livro), esse elemento deve estar em destaque no enquadramento, preferencialmente proximo ao rosto ou peito.
- **Sem destaques:** Se o usuario nao pedir nenhum detalhe especifico, desenhe apenas meio torso e a cabeca do personagem em uma pose passiva e clara.

## Estilo Visual

- **Geometrico e Minimalista:** Siga o mesmo estilo minimalista de `docs/svg-spritesheets.md`. Use formas simples (`circle`, `rect`, `path` limpos).
- **Sem Pixel Art Literal:** Nao gere milhares de retangulos de `1x1` simulando pixel art. Use vetores grandes e formas solidas.
- **Legibilidade:** Lembre-se que o retrato ainda aparecera pequeno na UI. Cores contrastantes, formas bem definidas e silhueta grande dentro do `64x64` sao cruciais.
- **Fundo:** O fundo deve ser obrigatoriamente transparente. Não desenhe formas de fundo (como `rect` ocupando todo o espaço) cobrindo o `viewBox`.

## Estrutura do SVG

Todo portrait em SVG gerado deve conter:

- `width="64"`
- `height="64"`
- `viewBox="0 0 64 64"`
- O conteudo deve estar totalmente contido ou clipado nesse viewBox.

Exemplo de base:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <!-- Corpo da entidade (fundo deve ser transparente) -->
  <path d="..." fill="..." />
  <!-- Cabeca da entidade -->
  <circle cx="32" cy="26" r="14" fill="..." />
</svg>
```

## Fluxo Obrigatorio para a IA

Sempre que solicitado a criar um portrait, siga exatamente estes passos:

1. Gere o codigo SVG do portrait de acordo com a descricao do usuario, garantindo que o viewBox seja `0 0 64 64` e que o personagem ocupe bem o enquadramento.
2. Salve o SVG no disco temporariamente.
3. **Converta o SVG para WebP.** O jogo carrega `.webp` em `public/assets/portraits/`. A IA deve usar `ffmpeg`, um script `node` com `sharp`, ou qualquer outro utilitario via terminal (ex: CLI do `sharp` usando `npx sharp-cli`) para converter a imagem final para `.webp`. A conversao deve preservar o tamanho de `64x64` (se ele nao distorcer).
4. Salve ou mova o arquivo convertido para `public/assets/portraits/<nome>.webp`.
5. Apague o arquivo `.svg` temporario e qualquer script auxiliar utilizado para a conversao, mantendo o repositorio limpo. O repositorio guarda os portraits apenas no formato WebP pronto para o jogo.
