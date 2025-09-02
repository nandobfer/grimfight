import React, { useEffect, useState } from "react"
import { Box, IconButton } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterCard } from "./CharacterCard"
import { StoreItem } from "../../game/creature/character/CharacterStore"

interface StoreListProps {
    game: Game
    playerGold: number
}

export const StoreList: React.FC<StoreListProps> = (props) => {
    const [characters, setCharacters] = useState<StoreItem[]>(props.game.playerTeam.store.items)

    useEffect(() => {
        const handler = (items: StoreItem[]) => {
            console.log("bateu aqui")
            setCharacters([...items])
        }

        EventBus.on("character-store", handler)

        return () => {
            console.log("desmontou")
            EventBus.off("character-store", handler)
        }
    }, [])

    return (
        <Box sx={{ flex: 1 }}>
            {characters.map((item) => (
                <CharacterCard item={item} key={item.character.id} game={props.game} disabled={props.playerGold < item.cost} />
            ))}
        </Box>
    )
}
