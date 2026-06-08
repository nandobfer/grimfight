# AGENTS.md

Guia normativo para qualquer IA que trabalhe neste repositório.

## 1. Contexto do projeto

Grim Fight é um jogo client-side estilo Teamfight Tactics: um auto battler roguelite com floors infinitos player versus enemy, montagem de esquadrão por drag-and-drop, itens combináveis, augments, traits, combates automáticos e persistência local.

Não há API, backend, banco remoto ou autenticação neste projeto. Toda regra de jogo roda no cliente. A persistência atual usa `localStorage`.

## 2. Ordem obrigatória de leitura

Antes de implementar, leia nesta ordem:

1. `README.md`
2. `package.json`
3. `src/game/main.ts`
4. `src/game/scenes/Game.ts`
5. O contexto específico da tarefa:
   - Personagens jogáveis: `src/game/creature/Creature.ts`, `src/game/creature/character/Character.ts`, `src/game/creature/character/PlayerTeam.ts`, `src/game/creature/CharacterRegistry.ts` e `src/game/creature/classes/`
   - Monstros e encontros: `src/game/creature/monsters/Monster.ts`, `src/game/creature/monsters/EnemyTeam.ts`, `src/game/creature/monsters/MonsterRegistry.ts` e `src/game/tools/Encounter.ts`
   - Itens e receitas: `src/game/systems/Items/Item.ts`, `src/game/systems/Items/ItemRegistry.ts` e `src/game/systems/Items/`
   - Augments: `src/game/systems/Augment/Augment.ts`, `src/game/systems/Augment/AugmentsRegistry.ts` e `src/game/systems/Augment/`
   - Traits e auras: `src/game/systems/Traits/` e `src/game/systems/Aura/`
   - Projéteis, efeitos e status: `src/game/objects/Projectile/`, `src/game/fx/` e `src/game/objects/StatusEffect/`
   - UI React: `src/ui/`, `src/PhaserGame.tsx` e `src/game/tools/EventBus.ts`
   - Desktop/Electron: `electron/` e `electron.vite.config.ts`

## 3. Regras não negociáveis

- Use TypeScript estrito. Evite `any`; não use `@ts-ignore` sem justificativa explícita.
- O código de jogo deve seguir orientação a objetos. Prefira estender classes existentes e usar polimorfismo antes de criar fluxos paralelos ou estruturas soltas.
- Não crie API, backend, autenticação, banco remoto ou dependência de servidor.
- Não mova regra complexa de combate, progressão, itemização ou balanceamento para componentes React.
- Preserve a separação entre engine/regra de jogo em `src/game` e overlay/interface em `src/ui`.
- Ao criar personagem, monstro, item, augment, trait, aura, projétil, status effect ou FX reutilizável, registre ou conecte a entidade no registry/sistema correspondente.
- Preserve o ciclo `idle`/`fighting`: drag-and-drop, compra, venda, bench, tavern e preparação não devem acontecer durante combate salvo quando a regra explicitamente permitir.
- Mantenha a persistência local consistente. Ao alterar dados salvos em `localStorage`, considere compatibilidade com saves existentes ou explique por que a migração não é necessária.
- Use exclusivamente `pnpm` para dependências, scripts e execução. Não use `npm` ou `yarn`.

## 4. Arquitetura atual

- `src/game/main.ts`: configuração Phaser, escala, render, physics, FPS e cenas.
- `src/game/scenes/Game.ts`: cena principal, estado global da run, floors, times, grid, economia, progressão, persistência e ponte com UI.
- `src/game/creature/`: hierarquia de entidades combatentes.
- `src/game/creature/Creature.ts`: classe base para unidades com stats, combate, movimento, itens, status effects, auras e UI interna.
- `src/game/creature/character/`: unidades do jogador, bench, store e time do jogador.
- `src/game/creature/classes/`: subclasses concretas de personagens jogáveis.
- `src/game/creature/monsters/`: monstros, time inimigo e registry.
- `src/game/systems/`: sistemas de gameplay como itens, augments, traits, auras, shopkeeper, tavern e records.
- `src/game/objects/`: objetos de gameplay como projéteis e status effects.
- `src/game/fx/`: efeitos visuais Phaser.
- `src/game/tools/`: utilitários de jogo como grid, RNG, encounter, EventBus, CR e textos tokenizados.
- `src/game/ui/`: UI Phaser acoplada a objetos de jogo, como barras, badges e damage numbers.
- `src/ui/`: overlay React/MUI, drawers, modais, HUD, menus e tooltips.
- `src/game/tools/EventBus.ts`: ponte entre Phaser e React. Toda subscription deve ter cleanup.
- `public/assets/`: sprites, spritesheets, imagens e demais assets.
- `electron/`: empacotamento desktop.

## 5. Orientação a objetos obrigatória

- Para personagem jogável, estenda `Character`.
- Para monstro, estenda `Monster`.
- Para qualquer unidade combatente genérica, use `Creature` como base.
- Para time/grupo, estenda ou reutilize `CreatureGroup`, `PlayerTeam` ou `EnemyTeam`.
- Para item, estenda `Item` e implemente `applyModifier`, `afterApplying` e/ou `cleanup` quando necessário.
- Para augment, estenda `Augment` e implemente `applyModifier` e/ou `onPick`.
- Para aura, siga os padrões em `src/game/systems/Aura/`.
- Para projétil, estenda `Projectile`.
- Para status temporário, estenda `StatusEffect` ou `Condition` conforme o comportamento.
- Para FX animado reutilizável, estenda `FxSprite` quando fizer sentido.
- Evite duplicar lógica por composição ad hoc quando já existe hierarquia apropriada.
- Use overrides explícitos (`override`) quando sobrescrever métodos de classes base.

## 6. Phaser, performance e memory leaks

- Preserve a meta de jogo fluido a 60 FPS.
- Evite alocações pesadas, criação repetida de arrays grandes, buscas globais e instanciamento desnecessário dentro de `update` ou callbacks de alta frequência.
- Prefira cache, registry, reuse, pooling ou cálculo sob demanda quando a lógica for chamada muitas vezes por frame/round.
- Todo `EventBus.on`, `scene.events.on`, listener de input, listener de DOM/window/document, timer, tween, collider, light, particle emitter e objeto auxiliar deve ter cleanup explícito.
- Use `once("destroy")`, `events.once(Phaser.Scenes.Events.SHUTDOWN)`, `AbortController`, `off`, `remove`, `stop`, `destroy` e `removeLight` conforme o recurso criado.
- Projéteis devem destruir colliders, timers, tweens e lights ao terminar.
- FX devem parar tweens, remover listeners de `update`, remover lights/particles e destruir sprites ao completar ou quando a rodada acabar.
- Status effects devem expirar corretamente e remover listeners de `died`/`destroy`.
- Não deixe physics debug, logs ruidosos ou instrumentação pesada ativos por padrão.
- Ao adicionar assets ou animações, evite recriar animações já existentes: verifique `scene.anims.exists` antes de `create`.
- Evite vazamento em hot reload e restart de cena. Se registrar no `create`, remova no shutdown ou destroy.

## 7. Gameplay e balanceamento

- Grim Fight é um auto battler roguelite infinito baseado em floors.
- O jogador prepara time, posicionamento e itens no estado `idle`; o combate automático ocorre no estado `fighting`.
- A progressão envolve vidas, gold, floor, loot, augments, inimigos escalonados e recordes locais.
- Encontros devem respeitar o sistema de challenge rating em `src/game/tools/Encounter.ts` e `src/game/tools/ChallengeRating.ts`.
- Itens componentes combinam em itens completos via `ItemRegistry`; não implemente receitas fora do registry.
- Traits, auras, augments e itens devem aplicar e limpar modificadores de forma previsível para não acumular bônus indevidos entre rounds.
- Ao mexer em stats, considere impacto em CR, escalonamento infinito, boss floors, itens inimigos e power spikes do jogador.
- Ao criar habilidade, priorize clareza de telegraph, feedback visual, cleanup e comportamento consistente com alvo, range, mana e estado da unidade.

## 8. UI React e ponte com Phaser

- React/MUI é overlay de interface, não fonte principal da regra de jogo.
- Use `EventBus` para comunicação entre React e Phaser quando necessário.
- Toda subscription em React deve ser registrada em `useEffect` e removida no cleanup.
- Componentes React devem refletir estado da cena ou emitir intenções simples; decisões complexas ficam em classes/sistemas de jogo.
- Preserve `pointerEvents` intencionalmente: overlays não devem bloquear drag/drop do canvas salvo quando forem interativos.
- Ao criar drawers, modais, HUD ou tooltips, trate loading, estado vazio, pausa e fechamento/cleanup.
- Não use Shadcn, Next.js, rotas ou padrões de API neste projeto.

## 9. Persistência local

- Persistência atual usa `localStorage` para progresso, personagens, bench, store e recordes.
- Centralize alterações de progresso nos métodos existentes da cena e dos sistemas relacionados.
- Não introduza storage remoto, backend ou autenticação.
- Se alterar formato de DTO salvo, considere saves antigos. Quando compatibilidade não for necessária, explique a decisão.
- Evite salvar em loops de alta frequência; salve em eventos relevantes de mudança de estado.

## 10. Stack e ferramentas oficiais

- Engine: Phaser 3.90 com Arcade Physics, Lights, Graphics e Sprites.
- UI: React 19 + MUI 7.
- Bundler: Vite 6.
- Desktop: Electron + electron-vite.
- Linguagem: TypeScript 5.7 em modo strict.
- Persistência: `localStorage`.
- Gerenciador de pacotes: exclusivamente `pnpm`.
- Desenvolvimento web: `pnpm dev-nolog`.
- Build web: `pnpm build-nolog`.
- Desenvolvimento Electron: `pnpm dev:electron`.
- Build Electron: `pnpm build:electron`.
- Não use `npm install`, `npm run`, `yarn` ou `yarn.lock` como fonte de verdade.
- Arquivos `package-lock.json` e `yarn.lock`, se presentes, devem ser tratados como legado até a migração completa para `pnpm-lock.yaml`.

## 11. Padrão de testes e verificação

- Atualmente não há suíte de testes configurada no repositório.
- Quando criar testes, prefira cobrir regras de negócio de jogo: combate, itens, receitas, augments, traits, CR, persistência e estados de round.
- Foque em comportamento e casos-limite, não em detalhes internos frágeis.
- Para mudanças sem testes automatizados, valide com build e, quando possível, teste manual no jogo.
- Verificação mínima recomendada para mudanças em TypeScript: `pnpm build-nolog`.
- Para mudanças Electron, também valide com `pnpm build:electron` ou `pnpm dev:electron`, conforme aplicável.

## 12. Checklist mínimo antes de encerrar

1. Li o contexto correto do projeto e da área alterada.
2. Não criei API, backend, autenticação ou dependência de servidor.
3. Usei `pnpm` nos comandos e não gerei lockfiles de `npm`/`yarn`.
4. Mantive TypeScript strict e evitei `any` desnecessário.
5. Respeitei a hierarquia OO existente e usei `override` quando aplicável.
6. Registrei novas entidades nos registries/sistemas corretos.
7. Mantive regra de jogo em `src/game` e UI/overlay em `src/ui`.
8. Preservei o ciclo `idle`/`fighting` e a progressão por floors.
9. Limpei listeners, timers, tweens, colliders, lights, particles e sprites criados.
10. Evitei trabalho pesado em `update` e callbacks de alta frequência.
11. Mantive persistência local consistente e considerei saves existentes.
12. Rodei `pnpm build-nolog` quando aplicável ou expliquei por que não rodei.
13. Atualizei documentação quando a mudança alterou comportamento, fluxo, contrato ou regra de jogo.
