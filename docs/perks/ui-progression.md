# UI de Meta-Progressão (Barracks / Heroes Timeline)

Este documento descreve a interface React responsável por exibir a progressão de conta (níveis e perks) de cada personagem.

## 1. Ponto de Acesso
Um novo botão chamado **"Heroes"** (ou "Barracks") será adicionado no menu principal do jogo (`GameMenu.tsx` ou tela inicial). Ele abrirá uma overlay ou modal em tela cheia com a lista de personagens.

## 2. Estrutura da Tela
A tela será dividida em linhas, uma para cada personagem existente no `CharacterRegistry`.
- **Esquerda (Fixo)**: Portrait do personagem gerado por IA (`CharacterAvatar` ou `ItemIcon` adaptado) e o Nome da classe.
- **Direita (Scrollable)**: O contêiner de Timeline, que permite scroll horizontal infinito ou até o limite visível das próximas recompensas.

## 3. A Timeline Animada (Framer Motion)
Cada personagem terá sua própria Timeline de progressão:
- **Trilha Base**: Uma linha pontilhada (`dashed`) se estendendo para a direita.
- **Barra de Progresso (Fill)**: Uma linha contínua, mais espessa e colorida, sobreposta à trilha base. Sua largura será animada usando `framer-motion` (propriedade `width` via `initial` e `animate`), calculada com base na porcentagem de XP para o próximo nível.
- **Nodos (Botões de Nível)**: Ao longo da linha, espaçados uniformemente, estarão quadrados estilizados contendo o número do nível.
  - **Estado Unlocked**: Nível já alcançado. Visual ativo/brilhante (ex: borda dourada).
  - **Estado Locked**: Nível futuro. Visual "disabled" ou opaco.

## 4. Tooltips de Perks
Cada nodo (botão de nível) terá uma Tooltip (usando `@mui/material/Tooltip` ou nosso próprio wrapper como referência de `ItemTooltip` / `AugmentCard`).
- **Conteúdo da Tooltip**:
  - **Nome do Perk**: Destacado. (Ex: *Toxic Spores* ou *Minor Enhancement*).
  - **Separador**: Uma linha sutil (Divider).
  - **Descrição**: Texto tokenizado usando nosso sistema padrão de cores, destacando valores de status como em augments e itens.
- O botão deverá permitir *hover* para revelar o tooltip independentemente de estar ativo (unlocked) ou desativado (locked), permitindo que o jogador planeje o futuro do personagem.