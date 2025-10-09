import React, { useState } from "react"
import { Autocomplete, Box, Button, TextField } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { ItemRegistry } from "../../game/systems/Items/ItemRegistry"

interface DebugFloorProps {
    game: Game
    closeMenu: () => void
}

export const DebugItems: React.FC<DebugFloorProps> = (props) => {
    const [itemKey, setItemKey] = useState("")

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        try {
            props.game.spawnItem(itemKey)
        } catch (error) {
            console.log(error)
            console.log("trouxa")
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <Box sx={{ gap: 1 }}>
                <Autocomplete
                    options={ItemRegistry.entries()}
                    renderInput={(params) => <TextField {...params} label="item" size="small" />}
                    sx={{ flex: 1 }}
                    value={itemKey}
                    onChange={(_, value) => setItemKey(value || "")}
                />
                <Button type="submit">spawn</Button>
            </Box>
        </form>
    )
}
