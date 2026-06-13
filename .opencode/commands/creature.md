---
description: Cria criaturas completas do Grim Fight, incluindo character ou monster, assets, registros, preview e revisão de balanceamento.
---

Crie uma criatura completa do Grim Fight a partir desta especificação:

$ARGUMENTS

Siga este workflow obrigatoriamente.

## Regra principal

Seja altamente inquisitivo. Antes de qualquer implementação, analise a especificação em detalhe e pergunte tudo que estiver ambíguo. Não comece código nem assets enquanto tipo da criatura, gameplay, visual, stats, traits, ataque básico, habilidade, mana, FX ou intenção de balanceamento ainda estiverem incertos.

## Regras do projeto

- Siga `AGENTS.md` e todas as regras do repositório.
- Use TypeScript strict. Evite `any` e não use `@ts-ignore` sem justificativa explícita.
- Mantenha regras de gameplay em `src/game`, não em React UI.
- Preserve o ciclo `idle`/`fighting`.
- Use orientação a objetos: characters estendem `Character`; monsters estendem `Monster`; projéteis estendem `Projectile`; FX reutilizáveis estendem `FxSprite`; status temporários seguem as classes existentes.
- Registre toda nova entidade no registry/sistema correto.
- Limpe listeners, timers, tweens, colliders, lights, partículas, sprites, status e objetos auxiliares criados.
- Use exclusivamente `pnpm` para comandos.
- Use `apply_patch` para edições manuais.

## Leitura obrigatória antes de implementar

Leia, nesta ordem, antes de implementar qualquer criatura:

1. `README.md`
2. `package.json`
3. `src/game/main.ts`
4. `src/game/scenes/Game.ts`
5. `src/game/creature/Creature.ts`
6. `src/game/creature/CharacterRegistry.ts`
7. `src/game/creature/character/Character.ts`
8. `src/game/creature/character/PlayerTeam.ts`
9. `src/game/creature/classes/`
10. `src/game/creature/monsters/Monster.ts`
11. `src/game/creature/monsters/EnemyTeam.ts`
12. `src/game/creature/monsters/MonsterRegistry.ts`
13. `src/game/creature/monsters/`
14. `aicontext/game-creatures.md`
15. `aicontext/game-monsters.md`

Use `aicontext/game-creatures.md` e `aicontext/game-monsters.md` para escolher a melhor referência existente. Depois leia as classes concretas mais próximas do comportamento pedido.

## Leitura obrigatória para assets

- Antes de criar ou alterar spritesheet de criatura, leia `docs/svg-spritesheets.md`.
- Antes de criar ou alterar portrait, leia `docs/svg-portraits.md`.
- Se a especificação pedir FX, projétil visual, partículas ou efeito reutilizável, leia `docs/svg-fx.md`.

## Perguntas obrigatórias quando houver ambiguidade

Confirme com o usuário qualquer item ausente ou ambíguo:

- Tipo: `character` jogável ou `monster`.
- Chave interna, nome exibido, fantasia e silhueta visual.
- Arquétipo: tank, bruiser, rogue, mage, archer, support, summoner, controller, assassin, artillery ou outro papel claro.
- Posição: frontline, midline, backline ou flexível.
- Ataque básico: melee/ranged, tipo de dano, projétil, alcance e efeitos especiais.
- Habilidade: nome, gatilho, comportamento exato, alvo, dano/cura/escudo/status, área, timing, cleanup e casos de falha.
- Mana: usa mana, passivo sem mana, mana inicial, mana máxima, trava de mana e frequência esperada de uso.
- Traits de characters, incluindo se são traits existentes ou novas.
- Papel do monster em encounters, posição preferida, intenção de challenge rating, escalonamento e se aparece em encounters comuns, bosses, summons ou subset específico.
- Stats e intenção de balanceamento: durabilidade, ataque, attack speed, armor, range, movimento, crítico e sustain quando relevante.
- Assets necessários: spritesheet, portrait e FX/projéteis opcionais.
- Nome/path esperado para preview.

Faça perguntas agrupadas e concisas. Se o usuário delegar algo ao seu julgamento, declare a suposição antes de implementar.

## Implementação

Depois de esclarecer tudo:

1. Inspecione as classes e sistemas mais próximos.
2. Implemente a classe da criatura seguindo o padrão existente.
3. Para playable character, coloque classes concretas em `src/game/creature/classes/` e registre em `src/game/creature/CharacterRegistry.ts`.
4. Para monster, coloque classes concretas em `src/game/creature/monsters/` e registre em `src/game/creature/monsters/MonsterRegistry.ts`.
5. Conecte traits, auras, projéteis, status, FX e visual definitions nos registries/sistemas corretos.
6. Crie a spritesheet SVG da criatura no formato obrigatório `576x1280`, grid `9x20`, frames `64x64`, conforme `docs/svg-spritesheets.md`.
7. Crie portrait como SVG temporário, converta para `public/assets/portraits/<nome>.webp` e remova o SVG temporário e scripts auxiliares.
8. Se houver FX/projétil novo, crie SVG no formato obrigatório `640x64`, 10 frames lineares, conforme `docs/svg-fx.md`.
9. Mantenha assets consistentes com a chave final da criatura.
10. Atualize `aicontext/` quando houver novo comportamento estável, integração, cleanup contract ou sistema reutilizável. Não documente números de balanceamento mutáveis nem fórmulas exatas, salvo se o usuário pedir.

## Preview

Depois de criar assets:

- Copie spritesheet, portrait e FX/projéteis novos, se houver, para os paths correspondentes em `/var/www/grimfight.com.br` para permitir preview.
- Antes de prometer preview, inspecione `src/preview/`.
- Use estes links públicos:
  - `https://grimfight.com.br/preview/creature-<nome>`
  - `https://grimfight.com.br/preview/portrait-<nome>`
  - `https://grimfight.com.br/preview/fx-<nome>`
- Destaque os links relevantes na resposta final.
- Se o preview publicado depender de manifesto gerado ou rebuild antes de reconhecer assets novos, diga isso claramente e proponha o comando/deploy necessário em vez de afirmar que o link foi confirmado.

## Revisão de balanceamento

Após implementar:

- Se for character, compare com personagens jogáveis do mesmo arquétipo.
- Considere poder da habilidade, custo de mana, frequência de uso, alvo, área, crowd control, sustain, shields, ataque básico, attack speed, range, vida, armor e traits.
- Respeite arquétipos: tanks podem ter mais vida/armor e menos dano; rogues podem ser frágeis e explosivos; mages podem ter básico fraco e spell forte; archers podem ter range/cadência; bruisers misturam defesa e dano; supports trocam dano por cura, shield ou utilidade.
- Se for monster, compare com monsters existentes e com o modelo de encounter/challenge rating.
- Aponte riscos de overpowered/underpowered.
- Proponha buffs/nerfs concretos quando necessário, mas pergunte antes de aplicar mudanças subjetivas de balanceamento, salvo se o usuário autorizou tunar livremente.

## Resposta final

Ao finalizar, informe:

- Arquivos alterados.
- Registries/sistemas atualizados.
- Assets criados e copiados para preview.
- Links de preview em destaque.
- Verificação feita com comandos `pnpm`, ou por que não foi rodada.
- Avaliação de balanceamento e decisões recomendadas.
