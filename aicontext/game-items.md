# Game Items

## Features

### Item
`Item` é a base de componentes, itens completos e artifacts. Ele controla sprite, borda visual, drag and drop, tooltip, merge preview, snap em criaturas, drop no board e sincronização de posição com o usuário equipado.

Itens possuem hooks de regra como `applyModifier`, `afterApplying` e `cleanup`. Qualquer item que registre listeners, timers ou efeitos persistentes deve remover esses recursos no cleanup ou quando o sprite for destruído.

### ItemRegistry
`ItemRegistry` centraliza registros de componentes, itens completos, artifacts e receitas. O registry cria itens por chave, lista categorias, sorteia itens respeitando exclusões, resolve receitas e expõe receitas relacionadas a componentes.

Receitas ficam exclusivamente no registry. O merge consulta os componentes equipados ou arrastados e cria o item resultante pelo registry, mantendo sprites antigos e tooltip limpos pelo fluxo de item e criatura.

### Components
Componentes são itens simples registrados por `registerComponent`. Cada componente estende `Item`, define chave, nome, descrição e aplica um modificador direto em stats da criatura.

Componentes documentados: Belt, Bow, Cloak, Gloves, Rod, Sword, Tear, Vest.

### Completed Items
Itens completos são registrados por `registerCompleted` junto de sua receita. Eles podem aplicar stats diretos, listeners de combate, status effects, timers, efeitos defensivos, efeitos ofensivos ou restrições de equipamento.

Itens completos documentados: Adaptivehelm, Archangelstaff, Bloodthirster, Bluebuff, Bramblevest, Crownguard, Deathblade, Dragonclaw, Evenshroud, Gargoylestoneplate, Giantslayer, Guinsoo, Handofjustice, Hextechgunblade, Infinityedge, Ionicspark, Jeweledgauntlet, Krakenslayer, Lastwhisper, Morello, Nashor, Nightedge, Protectorsvow, Quicksilver, Rabadon, Redbuff, Shojin, Spiritvisage, Steadfastheart, Sterak, Strikersflail, Sunfire, Thiefsgloves, Titanresolve, Voidstaff, Warmog.

### Artifacts
Artifacts são registrados por `registerArtifact` e usam a mesma base `Item`. Eles podem ser entregues por regras especiais, anvils ou encounters e devem seguir o mesmo contrato de modifier e cleanup dos demais itens.

Artifacts documentados: Dawncore, FlickerBlade, GoldCollector, Hullcrusher, InnervatingLocket, LichBane, LudensTempest, Manazane, ProwlersClaw, RapidFireCannon, SeekersArmGuard, TalismanOfAscension, TitanicHydra, TrinityForce, UnendingDespair, WitsEnd.

### Drag Tooltip And Snap
O drag de item só deve alterar regra de jogo por intenção explícita do usuário. Durante drag, o item mostra tooltip próprio ou tooltip de resultado de merge, detecta criaturas em células do grid e reposiciona o sprite para preview de equipamento.

Ao equipar, a criatura assume o item e registra sync no evento de movimento. Ao desequipar, cleanup é executado, o usuário é removido e o listener de movimento é desligado.

### Thiefsgloves
Thiefsgloves possui restrição especial de equipamento e gera itens temporários por rodada. Ele escuta mudança de estado da cena para equipar e limpar esses itens, removendo listeners e sprites temporários em cleanup.

## Fixes
