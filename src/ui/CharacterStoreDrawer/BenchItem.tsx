import React, { useMemo } from "react"
import { Badge, Box, Button, Tooltip, useMediaQuery } from "@mui/material"
import { CharacterDto } from "../../game/creature/character/Character"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { Game } from "../../game/scenes/Game"
import { GoldCoin } from "../components/GoldCoin"
import { AbilityTooltip } from "../CharacterSheet/AbilityTooltip"

interface BenchItemProps {
    character?: CharacterDto
    game: Game
}

export const BenchItem: React.FC<BenchItemProps> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    const character = props.character
    const team = props.game.playerTeam
    const levelColor = useMemo(() => (character ? convertColorToString(colorFromLevel(character.level)) : ""), [character?.level])

    const summon = () => {
        console.log(character)
        if (!character) return
        team.bench.summon(character.id)
    }

    return (
        <AbilityTooltip description={character?.abilityDescription || '' } placement="top"  >
            <Box sx={{ flexDirection: "column", flex: 1, pointerEvents: !character ? 'none' : undefined }}>
            <Button
                sx={{ width: 1, padding: 2, filter: !character ? "grayscale(100%)" : undefined, paddingBottom: 0.5, overflowX: "auto" }}
                onClick={summon}
                disabled={!character}
            >
                <Badge
                    badgeContent={character ? `${character.level}` : ""}
                    slotProps={{
                        badge: {
                            sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold", fontSize: isMobile ? 8 : undefined },
                        },
                    }}
                >
                    <CharacterAvatar name={character?.name || ""} size={35} />
                </Badge>
            </Button>
            <Tooltip title="Vender">
                <Button
                    color="warning"
                    onClick={() => team.bench.sell(character?.id || "")}
                    size="small"
                    sx={{ minWidth: 0, visibility: !character ? "hidden" : undefined }}
                >
                    <GoldCoin quantity={team.store.getCost(character?.level || 0)} fontSize={10} size={10} />
                </Button>
            </Tooltip>
        </Box>
        </AbilityTooltip>
    )
}
