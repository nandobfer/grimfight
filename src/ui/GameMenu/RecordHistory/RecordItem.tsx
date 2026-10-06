import { useMemo } from "react"
import { Badge, Box, Chip, Paper, Tooltip, Typography } from "@mui/material"
import type { GameRecord } from "../../../game/systems/GameRecord"
import { GameRecordTraits } from "../../../game/systems/GameRecordTraits"
import { CharacterAvatar } from "../../CharacterSheet/CharacterAvatar"
import { AbilityTooltip } from "../../CharacterSheet/AbilityTooltip"
import { ItemIcon } from "../../components/ItemIcon"

export const RecordItem = ({ record }: { record: GameRecord }) => {
    const traits = useMemo(() => GameRecordTraits.resolve(record), [record])
    return (
        <Paper variant="outlined" component="article" sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, minWidth: 0 }}>
            <Box sx={{ justifyContent: "space-between", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Andar {record.floor}</Typography>
                <Typography variant="body2" color="text.secondary">{new Date(record.finishedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</Typography>
            </Box>
            <Box sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                {traits.length === 0 && <Typography variant="caption" color="text.secondary">Nenhuma trait ativa.</Typography>}
                {traits.map((trait) => <Chip key={trait.name} size="small" label={`${trait.name} · ${trait.stage}`} variant="outlined" />)}
                {record.traits === undefined && <Tooltip title="Este registro não possui snapshot de traits. A composição é interpretada pelas regras atuais."><Chip size="small" color="warning" variant="outlined" label="Traits estimadas" /></Tooltip>}
            </Box>
            <Typography variant="caption" color="text.secondary">Composição final</Typography>
            <Box sx={{ flexWrap: "wrap", gap: 2, minWidth: 0 }}>
                {record.comp.length === 0 && <Typography variant="body2" color="text.secondary">Composição não disponível.</Typography>}
                {record.comp.map((character, index) => <Box key={`${character.id}-${index}`} sx={{ flexDirection: "column", gap: 0.75, alignItems: "center", width: 76 }}>
                    <AbilityTooltip description={character.abilityDescription} placement="auto">
                        <Badge badgeContent={character.level} color="primary"><CharacterAvatar name={character.name} size={48} variant="circular" /></Badge>
                    </AbilityTooltip>
                    <Typography variant="caption" noWrap sx={{ maxWidth: 1 }} title={character.name}>{character.name}</Typography>
                    <Box sx={{ gap: 0.5, flexWrap: "wrap", justifyContent: "center" }}>
                        {character.items.map((item, itemIndex) => <Tooltip key={`${item}-${itemIndex}`} title={item}><Box><ItemIcon itemKey={item} size={18} /></Box></Tooltip>)}
                    </Box>
                </Box>)}
            </Box>
        </Paper>
    )
}
