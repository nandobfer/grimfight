# Game Balance

Este documento orienta a IA em tarefas de analise, revisao ou alteracao de balanceamento de combate do Grim Fight. Ele nao define valores, formulas fixas, percentuais, thresholds, duracoes ou metas numericas. Use-o para entender como raciocinar sobre impacto, risco e escopo antes de propor ou modificar regras de gameplay.

## Escopo

O foco deste documento e balanceamento de combate: criaturas jogaveis, monstros, habilidades, stats, dano, cura, shield, mana, alcance, mobilidade, controle, summons, status effects, traits, auras, itens, artifacts, augments de combate, encounters e challenge rating.

Economia, loja, tavern, recompensas, vidas, recordes e persistencia so entram na analise quando alteram diretamente a forca em combate, a disponibilidade de poder em combate ou o ritmo de acesso a unidades, itens e augments.

## Quando Usar

Leia este documento antes de trabalhar em qualquer pedido que envolva:

- Buff, nerf, rebalanceamento ou revisao de poder.
- Criacao ou alteracao de personagem, monstro, habilidade, item, artifact, augment, trait, aura, status effect, summon ou encounter.
- Analise de unidade forte/fraca, item dominante, combo abusivo, floor injusto, boss desproporcional ou progressao de dificuldade.
- Mudancas em stats base, escalonamento, mana, cooldown implicito por ataque, cadence de cast, dano, cura, shield, controle, alcance, area, alvo ou regras de reset/cleanup.

Quando o pedido for direto e o contexto for suficiente, avance com base nos sistemas existentes. Faca perguntas apenas quando faltar informacao essencial ou houver ambiguidade real sobre o objetivo da mudanca.

## Contexto Obrigatorio

Antes de opinar ou editar balanceamento, leia os documentos de contexto relacionados ao sistema afetado:

- `aicontext/game-creature-core.md` para contratos de stats, dano, cura, shield, mana, alvo, reset, itens, auras e update.
- `aicontext/game-creatures.md` para identidade e contratos estaveis dos personagens jogaveis.
- `aicontext/game-monsters.md` para monstros, encounters e challenge rating.
- `aicontext/game-items.md`, `aicontext/game-items-completed.md` e `aicontext/game-items-artifacts.md` para itemizacao e gatilhos de combate.
- `aicontext/game-augments.md` para augments de stats, combate e efeitos de escolha.
- `aicontext/game-traits.md` e `aicontext/game-auras.md` para sinergias, stages, aplicacao e cleanup.
- `aicontext/game-status-effects.md`, `aicontext/game-projectiles.md` e `aicontext/game-summon.md` quando a mudanca envolver status, projeteis ou invocacoes.
- `aicontext/game-scene.md` quando a mudanca afetar ciclo de round, floor, augments de inimigos ou criacao de encounters.

Quando alterar codigo, consulte tambem as classes e registries reais em `src/game`, porque os documentos de `aicontext/` registram contratos estaveis e podem omitir detalhes mutaveis de balanceamento.

## Principios De Analise

- Preserve a identidade da entidade. Ajuste poder sem transformar o papel funcional original de personagem, monstro, item, trait ou augment.
- Identifique a fonte real do problema antes de mexer em stats. O excesso de poder pode vir de frequencia de ativacao, alvo, area, reset, stacking, escalonamento, itemizacao, trait, augment ou encounter.
- Prefira a menor alteracao correta. Ajuste uma alavanca por vez quando possivel para manter a causalidade clara.
- Compare entidades pelo mesmo papel e contexto de acesso, nao apenas por dano bruto ou sobrevivencia isolada.
- Considere o combate completo. Burst inicial, dano sustentado, tempo ate o primeiro cast, retarget, mortes, summons, controle e cleanup podem importar mais que o resultado de um unico hit.
- Evite power creep. Quando uma entidade parece fraca, verifique se o problema e dela, do ambiente, dos inimigos, dos itens disponiveis ou de uma comparacao contra uma entidade dominante.
- Preserve contratos de reset, cleanup e `idle`/`fighting`. Um ajuste de balanceamento nao deve acumular bonus entre rounds nem deixar listeners, timers, tweens, colliders, lights ou status persistindo indevidamente.

## Eixos De Poder

Ao avaliar uma mudanca, classifique quais eixos ela afeta:

- Dano direto, dano ao longo do tempo, dano em area, dano dividido, dano adicional em hit, dano por cast e dano de execute.
- Sobrevivencia por vida, armadura, resistencia magica, block, shield, reducao de dano, imunidade, intangibilidade ou perda de alvo.
- Sustain por cura, lifesteal, regen, drain, cura em area, cura condicional ou conversao de dano em vida.
- Mana e cadence por mana inicial, mana maxima, regen, mana por ataque, mana por receber dano, lock de mana, channeling e resets de cast.
- Frequencia de ataque por attack speed, animacao, range, projectile speed, on-hit, multi-hit e special attacks periodicos.
- Controle por freeze, stun, slow, knockback, taunt implicito, perda de alvo, invisibilidade, reposicionamento ou interrupcao.
- Mobilidade por dash, blink, teleport, perseguicao, retarget, escolha de posicao e acesso a backline.
- Alcance e alvo por prioridade, aleatoriedade, alvo de menor vida, alvo distante, alvo atual, adjacencia, cone, linha e area.
- Escalamento por floor, stats atuais, stats base, mana maxima, vida maxima, dano recebido, tempo vivo, kills, ataques, casts ou composicao.
- Utilidade por auras, debuffs, buffs de time, traits, summons, minions, status persistentes e manipulacao de targeting.

Cada eixo forte consome parte do orcamento de poder da entidade. Ao adicionar forca em um eixo, avalie se outro eixo precisa permanecer limitado para manter clareza e contrajogo.

## Papeis De Combate

Use papeis funcionais para comparar entidades:

- Frontline: deve absorver pressao, controlar espaco ou proteger aliados, mas nao precisa competir com carries em dano sustentado.
- Backline: pode entregar dano, cura ou utilidade com risco reduzido, mas deve depender de posicionamento, frontline ou fragilidade relativa.
- Caster: concentra poder na cadence de cast, no efeito da habilidade e na interacao com mana, AP, critico de habilidade e interrupcoes.
- Auto attacker: concentra poder em ataques, on-hit, attack speed, alcance, critico, mana por ataque e itens de hit.
- Assassin ou diver: acessa alvos prioritarios por mobilidade ou targeting, mas precisa ter janelas claras de risco, alvo e reset.
- Tank: converte tempo vivo em valor por controle, auras, shield, retaliacao ou protecao, sem invalidar completamente dano inimigo.
- Support: aumenta a eficiencia do time por cura, shield, buffs, debuffs, mana, summons ou reposicionamento, com impacto medido pela equipe e nao por dano pessoal.
- Summoner: distribui poder em entidades extras; avalie body blocking, dano, tankiness, traits herdadas, targeting e limpeza no fim do round.
- Hybrid: combina eixos, mas cada eixo deve ser menos extremo que o de uma entidade especializada equivalente.

## Alavancas Seguras De Ajuste

Antes de alterar valores brutos, considere qual alavanca descreve melhor o problema:

- Frequencia: quando o efeito e correto, mas acontece cedo demais, tarde demais ou vezes demais.
- Alvo: quando o efeito e correto, mas atinge o alvo errado, ignora contrajogo ou escolhe backline com consistencia excessiva.
- Area: quando a habilidade escala demais com agrupamento, summons ou tamanho de time.
- Janela: quando o efeito precisa de telegraph, delay, channeling, duracao limitada ou encerramento claro.
- Escalamento: quando o efeito cresce com a fonte errada ou compoe de forma explosiva com itens, traits, augments ou floor.
- Reset: quando o efeito carrega estado entre rounds, revive, troca de alvo, morte, summon, clone ou mudanca de `gamestate`.
- Custo de oportunidade: quando item, trait, augment ou posicao entrega poder sem exigir slot, composicao, risco, tempo ou condicao equivalente.

## Riscos Comuns

Investigue com cuidado quando a mudanca tocar em:

- Multiplicadores compostos entre AP, AD, critico, damage amplification, lifesteal, area e multi-hit.
- Lifesteal, drain ou cura derivados de dano em area, dano dividido, dano verdadeiro, DoT ou dano adicional recorrente.
- Attack speed stacking com on-hit, mana por ataque, casts frequentes ou conversao de stats.
- Mana loops criados por mana inicial, mana maxima reduzida, ganho por ataque, ganho por receber dano, regen e refund pos-cast.
- Shields recorrentes, thorns, block, reducao de dano e cura recebida, especialmente em frontliners e bosses.
- Summons que herdam stats atuais, traits, augments, itens ou auras sem limite claro.
- Efeitos que removem alvo, tornam a unidade inalvejavel, teleportam para backline ou resetam agro.
- Executes, true damage, debuffs defensivos, reducao de cura e efeitos que ignoram parte relevante da mitigacao.
- Listeners de eventos como `afterAttack`, `dealt-damage`, `damage-taken`, `cast`, `kill`, `gamestate`, `shield-broken` e `died`.

## Encounters E Challenge Rating

Quando balancear monstros ou encounters:

- Respeite o fluxo de `generateEncounter`, `MonsterRegistry`, `EnemyTeam` e `ChallengeRating`.
- Considere que alterar stats base de monstros afeta CR, distribuicao de encounter, escalonamento, boss floors e itemizacao inimiga.
- Verifique se a mudanca altera o papel do monstro na composicao inimiga, como frontline, backline, caster, assassin, summoner ou boss.
- Em bosses, avalie efeitos que escalam com vida, shield, sustain, area, summons e itens, pois a duracao maior do combate amplifica mecanicas recorrentes.
- Se a alteracao mudar a relacao entre stats base e CR, invalide ou atualize caches/parametros conforme o sistema existente exigir.

## Itens, Artifacts, Traits E Augments

Ao balancear modificadores externos a criatura:

- Analise gatilho, frequencia, condicao, alvo, duracao, stacking e cleanup antes de ajustar o efeito.
- Itens devem ser avaliados pelo custo de slot e pela compatibilidade com perfis de usuario, nao como bonus isolado.
- Artifacts podem ser mais transformadores, mas ainda precisam ter condicao, janela, risco de stacking e limpeza previsiveis.
- Traits devem considerar composicao exigida, numero de unidades unicas, stage ativo, reaplicacao, cleanup e sinergia com summons ou clones.
- Augments devem considerar momento da escolha, persistencia pela run, impacto no time inteiro, impacto em inimigos e combinacao com itens/traits.
- Auras e debuffs precisam evitar duplicacao indevida ao reposicionar, resetar, reaplicar traits ou trocar estado do round.

## Fluxo Recomendado Para A IA

1. Identifique o pedido como analise, criacao, buff, nerf, bug de balanceamento ou revisao de risco.
2. Leia os documentos de contexto e o codigo real dos sistemas afetados.
3. Defina a hipotese de balanceamento em termos de papel e eixo de poder, sem depender de valores absolutos.
4. Procure interacoes com itens, artifacts, augments, traits, auras, status, summons, CR, boss floors e inimigos com itens.
5. Escolha a menor alavanca que corrige a causa provavel.
6. Preserve reset, cleanup, estado `idle`/`fighting`, registries e separacao entre regra de jogo e UI.
7. Quando documentar a mudanca em `aicontext/`, registre contratos estaveis: quem aplica, quando ativa, que tipo de efeito ocorre, qual sistema resolve e como limpa.

## Output De Analise Numerica

Quando o usuario pedir como esta o balanceamento atual de uma entidade, a resposta deve incluir uma analise baseada nos numeros atuais do codigo. Esta regra vale para o output da analise, nao para este documento: nao registre aqui valores fixos de personagens, itens, traits ou formulas mutaveis.

Na resposta, inclua:

- Uma indicacao clara se alguma correcao de contrato foi feita ou se a analise e apenas diagnostica.
- Um bloco de stats atuais relevantes extraidos do codigo real, como vida, dano, attack speed, alcance, AP, mana, critico, defesa, lifesteal ou outros atributos que importem para o papel da entidade.
- Uma estimativa simples do resultado esperado usando as formulas atuais do jogo, como dano medio por ataque, DPS de ataques basicos, cura media, shield medio, frequencia de proc, tempo ate cast ou valor por janela de combate.
- Quando a entidade tiver habilidade ativa, cast passivo, habilidade periodica ou efeito equivalente, inclua frequencia estimada de cast, DPS estimado do cast e DPS total considerando ataques, procs, casts, DoTs, summons e demais fontes recorrentes relevantes.
- O efeito esperado de traits, augments, itens ou artifacts que sejam sinergias obvias da entidade analisada.
- Uma comparacao com classes ou entidades similares pelo mesmo papel funcional, explicando onde a entidade ganha e onde perde.
- Um veredito direto dizendo se parece fraco, adequado, forte ou dependente de sinergia, e quais cenarios devem ser observados.

Ao calcular numeros no output:

- Derive tudo do codigo atual, sem reutilizar valores lembrados de analises anteriores.
- Declare suposicoes importantes, como alvo sem armadura, ausencia de itens, ausencia de traits, chance media de critico ou dano medio da variacao aleatoria.
- Use aproximacoes quando a simulacao completa nao for necessaria, mas deixe claro que sao aproximacoes.
- Compare tambem contra o contrato de identidade da entidade: uma entidade pode ter DPS menor e ainda estar correta se entrega controle, sustain, seguranca, summons ou utilidade.
- Nao transforme estimativas em contratos permanentes de balanceamento. Se a analise precisar ser documentada em `aicontext/`, registre apenas a logica e os riscos, nao os valores atuais.

## Testes E Verificacao

Testes de balanceamento devem proteger comportamento, invariantes e integracoes, nao numeros mutaveis:

- Verifique que resultados sao finitos, validos e respeitam limites de vida, shield, mana e estado ativo.
- Derive expectativas da configuracao atual quando um teste precisar comparar ratios, stages, delays ou multiplicadores.
- Cubra cleanup de listeners, timers, tweens, colliders, status e efeitos persistentes quando o balanceamento depender de eventos.
- Para dano, cura, shield e mana, prefira testar proporcionalidade, distribuicao, alvo correto, split correto, ausencia de acumulacao entre rounds e respeito a locks.
- Para encounters, teste propriedades do gerador e integracao com CR em vez de congelar composicoes ou valores exatos.

## O Que Evitar

- Registrar neste documento valores ideais, formulas exatas, percentuais, duracoes, thresholds ou numeros de stats.
- Corrigir toda percepcao de fraqueza com aumento de dano bruto.
- Balancear uma entidade ignorando itens, traits, augments, auras, summons e enemies escalados.
- Criar fluxos paralelos de regra fora das classes e registries existentes.
- Mover decisao de combate ou balanceamento para componentes React.
- Adicionar estado persistente, listeners ou efeitos recorrentes sem cleanup explicito.
