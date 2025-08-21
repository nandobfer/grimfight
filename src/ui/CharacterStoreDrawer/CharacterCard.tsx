import React, { useState } from "react"
import { Badge, Box, Button, Divider, Typography } from "@mui/material"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { Game } from "../../game/scenes/Game"
import { GoldCoin } from "../components/GoldCoin"
import { StoreItem } from "../../game/creature/character/CharacterStore"

interface CharacterCardProps {
    game: Game
    item: StoreItem
    isFirst?: boolean
    isLast?: boolean
    disabled?: boolean
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ item, game, isFirst, isLast, disabled }) => {
    const character = item.character
    const [sold, setSold] = useState(false)

    const buyCharacter = () => {
        game.playerTeam.store.buy(item)
        setSold(true)
    }

    return (
        <>
            {!isFirst && <Divider />}
            <Button
                fullWidth
                sx={{
                    padding: 1,
                    gap: 1,
                    flexDirection: "column",
                    justifyContent: "start",
                    filter: disabled ? "grayscale(100%)" : undefined,
                    visibility: sold ? "hidden" : undefined,
                }}
                disabled={disabled || sold}
                onClick={buyCharacter}
            >
                <Badge badgeContent={character.level} color="warning" overlap="circular">
                    <CharacterAvatar name={character.name} size={(5 / 100) * window.innerWidth} disabled={disabled} />
                </Badge>

                <Box sx={{ width: 1, gap: 1 }}>
                    <Typography variant="subtitle2">{character.name}</Typography>

                    <Box sx={{ marginLeft: "auto" }}>
                        <GoldCoin quantity={item.cost} size={15} fontSize={16} reverted />
                    </Box>
                </Box>
            </Button>
            {!isLast && <Divider />}
        </>
    )
}
