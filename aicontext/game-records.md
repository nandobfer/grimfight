# Game Records

## Features

### GameRecord
`GameRecord` é o DTO de recorde local da run. Ele guarda data de término, floor alcançado, composição salva por `CharacterDto` e augments escolhidos.

Records são persistidos localmente pela cena e usados para exibir histórico de runs sem backend, autenticação ou storage remoto.

### Historical Traits
Novas runs encerradas incluem um snapshot opcional dos nomes e estágios das traits ativas na composição final salva. `GameRecordTraits` resolve esse snapshot sem reinterpretar as sinergias pelo registry atual. Um snapshot vazio representa ausência de traits ativas.

Registros antigos sem snapshot continuam compatíveis: suas traits são reconstruídas pela composição final usando o registry atual e identificadas na interface como estimadas. Lista e estatísticas usam o mesmo contrato de resolução. A captura não aplica modificadores de combate.

### Statistics And History
`GameRecordStatistics` centraliza a normalização e agregação do histórico em memória. Resumo, lista e gráficos incluem o mesmo conjunto de runs encerradas com data e andar válidos. A leitura não reescreve saves antigos; campos opcionais da composição recebem defaults de apresentação.

Contagens incluem todas as runs válidas, independentemente de superar ou igualar um recorde. Personagens e traits contam uma única vez por run, considerando a composição final, e não toda unidade utilizada durante a partida. Máximo e média são calculados separadamente das contagens.

Resultados diários usam o calendário local e permanecem em ordem cronológica. Dias sem runs não recebem resultados artificiais de andar zero. Rankings seguem a métrica selecionada com desempates determinísticos.

O diálogo separa estatísticas e lista de runs, apresenta resumo compartilhado, evolução temporal e rankings horizontais com eixos numéricos e tooltips em português. Registros aparecem do mais recente para o mais antigo. O layout se adapta ao espaço disponível sem largura fixa nos gráficos. Fechar o histórico aberto pelo menu não retoma o jogo pausado; o menu pai controla essa pausa.

## Fixes
