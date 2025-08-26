import React, { useEffect, useState } from "react"
import { Box, IconButton } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterCard } from "./CharacterCard"
import { usePlayerProgress } from "../hooks/usePlayerProgress"
import { StoreItem } from "../../game/creature/character/CharacterStore"
import { Refresh } from "@mui/icons-material"
import { GoldCoin } from "../components/GoldCoin"

interface StoreListProps {
    game: Game
}

export const StoreList: React.FC<StoreListProps> = (props) => {
    const { playerGold } = usePlayerProgress()

    const [characters, setCharacters] = useState<StoreItem[]>(props.game.playerTeam.store.items)

    const shuffle = () => {
        props.game.playerTeam.store.shuffle(false)
    }

    useEffect(() => {
        const handler = (items: StoreItem[]) => {
            setCharacters([...items])
        }

        EventBus.on("character-store", handler)

        return () => {
            EventBus.off("character-store", handler)
        }
    }, [])

    return (
        <Box sx={{ flex: 1 }}>
            <Box sx={{ flexDirection: "column", alignItems: "center", filter: playerGold < 2 ? "grayscale(100%)" : undefined, flex: 1 }}>
                <IconButton color="primary" onClick={shuffle} disabled={playerGold < 2} sx={{}}>
                    <Refresh />
                </IconButton>
                <GoldCoin quantity={2} fontSize={10} size={10} />
            </Box>
            {characters.map((item) => (
                <CharacterCard item={item} key={item.character.id} game={props.game} disabled={playerGold < item.cost} />
            ))}
        </Box>
    )
}
