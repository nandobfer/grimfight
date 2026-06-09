# Game Auras

## Features

### Aura
`Aura` é a base de efeitos compartilhados aplicados por criaturas ou times. Ela mantém nome, stats opcionais e id único.

`tryApply` sempre chama cleanup antes de aplicar novamente, evitando listeners duplicados e bônus acumulados indevidamente.

### PaladinAura
`PaladinAura` é a base das auras de Lalatina. Ela guarda caster e classe de FX, e cria feedback visual quando aplica em uma criatura.

### ProtectionAura
`ProtectionAura` aplica efeito defensivo direto em criaturas e usa FX de proteção. Ela não registra listeners persistentes.

### GuardianAura
`GuardianAura` escuta eventos de cura em cada criatura aplicada para conceder shield conforme o fluxo atual. Ela armazena handler em `eventHandlers`, remove handler anterior antes de reaplicar e limpa listener no cleanup ou destroy.

### SmiteAura
`SmiteAura` escuta críticos de criaturas aplicadas para causar dano holy adicional pelo caster. Ela armazena handler em `eventHandlers`, remove handler anterior antes de reaplicar e limpa listener no cleanup ou destroy.

## Fixes
