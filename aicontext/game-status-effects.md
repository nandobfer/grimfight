# Game Status Effects

## Features

### Lifecycle And Cleanup
`StatusEffect` representa o tempo e ciclo de vida de modificações contínuas ou temporárias. `start()` injeta a instância na lista de statusEffects da criatura alvo e assina eventos `died` e `destroy` da criatura para limpeza prematura.
`expire()` efetiva o término da duração, removendo a si mesmo da coleção e cancelando as assinaturas.

### Condition
Uma subclasse especializada que aplica modificadores diretos aos atributos base de uma criatura por tempo determinado. `onApply` salva os valores prévios da criatura no registro interno `conditionsValues`. `onExpire` resgata esses valores e efetua o reestabelecimento seguro do estado, em conjunto com o cleanup de efeitos visuais associados.

### Dot And Hot
*   **Dot (Damage over Time):** Acumula contagem conforme um tick rate. Ao estourar, executa rotina de cálculo de dano provindo do usuário lançador (`user.calculateDamage`) e aplica o dano contínuo marcando a fonte primária.
*   **Hot (Heal over Time):** De forma análoga ao Dot, invoca um tick de cura periódica, respeitando tetos e limites, curando a entidade alvo e delegando visualização.

### Freeze
Opera como uma `Condition` estrutural, assinalando o modificador específico de `frozen` na criatura, o que, por padrão nos sistemas de core, interrompe sua capacidade de caminhar, atacar e acumular manas.

## Fixes
