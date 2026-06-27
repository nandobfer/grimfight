# Game Status Effects

## Features

### Lifecycle And Cleanup
`StatusEffect` representa o tempo e ciclo de vida de modificações contínuas ou temporárias. `start()` injeta a instância na lista de statusEffects da criatura alvo e assina eventos `died` e `destroy` da criatura para limpeza prematura.
`expire()` efetiva o término da duração, removendo a si mesmo da coleção e cancelando as assinaturas.

### Condition
Uma subclasse especializada que aplica modificadores diretos aos atributos base de uma criatura por tempo determinado. `onApply` salva os valores prévios da criatura no registro interno `conditionsValues`. `onExpire` resgata esses valores e efetua o reestabelecimento seguro do estado, em conjunto com o cleanup de efeitos visuais associados.

### Dot And Hot
*   **Dot (Damage over Time):** Acumula contagem conforme um tick rate. Ao estourar, executa rotina de cálculo de dano provindo do usuário lançador (`user.calculateDamage`) e aplica o dano contínuo marcando a fonte primária. Também expõe o dano bruto restante por helper puro para habilidades que interagem com potencial pendente de dano ao longo do tempo.
*   **Hot (Heal over Time):** De forma análoga ao Dot, invoca um tick de cura periódica, respeitando tetos e limites, curando a entidade alvo e delegando visualização.

### Freeze
Opera como uma `Condition` estrutural, assinalando o modificador específico de `frozen` na criatura, o que, por padrão nos sistemas de core, interrompe sua capacidade de caminhar, atacar e acumular manas.

### FireEmpowerment
Status temporário usado por Melisandre para fortalecer aliados. Ao aplicar, ele adiciona cadência de ataque, registra um gatilho de pós ataque para causar dano de fogo calculado pela conjuradora e creditado ao aliado empoderado, além de criar uma aura flamejante desenhada com `Graphics`.

Ao expirar, remove o bônus, desregistra o gatilho e destrói o visual. O status também observa mudança de estado da rodada para limpar o efeito antes que resets de criaturas descartem a coleção de status sem executar cleanup individual.

## Fixes
