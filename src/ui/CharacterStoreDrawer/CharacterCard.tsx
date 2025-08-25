import React, { useMemo, useState } from "react"
import { Badge, Box, Button, Divider, Typography, useMediaQuery } from "@mui/material"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { Game } from "../../game/scenes/Game"
import { GoldCoin } from "../components/GoldCoin"
import { StoreItem } from "../../game/creature/character/CharacterStore"
import { colorFromLevel, convertColorToString, RarityColors } from "../../game/tools/RarityColors"
import { AbilityTooltip } from "../CharacterSheet/AbilityTooltip"

interface CharacterCardProps {
    game: Game
    item: StoreItem
    isFirst?: boolean
    isLast?: boolean
    disabled?: boolean
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ item, game, isFirst, isLast, disabled }) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    const character = item.character

    const levelColor = useMemo(() => convertColorToString(colorFromLevel(character.level)), [character.level])

    const buyCharacter = () => {
        game.playerTeam.store.buy(item)
    }

    return (
        <>
            {!isFirst && <Divider />}
            <AbilityTooltip description={character.abilityDescription}>
                <Button
                    fullWidth
                    sx={{
                        padding: 1,
                        gap: 1,
                        flexDirection: "column",
                        justifyContent: "start",
                        filter: disabled ? "grayscale(100%)" : undefined,
                        visibility: item.sold ? "hidden" : undefined,
                    }}
                    disabled={disabled || item.sold}
                    onClick={buyCharacter}
                >
                    <Badge
                        badgeContent={`Lv ${character.level}`}
                        slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
                        overlap="circular"
                    >
                        <CharacterAvatar name={character.name} size={((isMobile ? 10 : 4) / 100) * window.innerWidth} disabled={disabled} />
                    </Badge>

                    <Box sx={{ width: 1, gap: 1 }}>
                        <Typography variant="subtitle2" fontSize={isMobile ? 8 : undefined}>
                            {character.name}
                        </Typography>

                        <Box sx={{ marginLeft: "auto" }}>
                            <GoldCoin quantity={item.cost} size={isMobile ? 7 : 15} fontSize={isMobile ? 9 : 16} reverted />
                        </Box>
                    </Box>
                </Button>
            </AbilityTooltip>
            {!isLast && <Divider />}
        </>
    )
}
