import React, { useState } from "react"
import { Autocomplete, Box, Button, TextField } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { CharacterRegistry } from "../../game/creature/CharacterRegistry"
import { RNG } from "../../game/tools/RNG"

interface DebugFloorProps {
    game: Game
    closeMenu: () => void
}

export const DebugCharacter: React.FC<DebugFloorProps> = (props) => {
    const [level, setLevel] = useState("1")
    const [characterName, setCharacterName] = useState("")

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const validLevel = Number(level.replace(/\D/g, ""))
        if (validLevel < 1) return

        try {
            const character = CharacterRegistry.create(characterName, props.game, RNG.uuid())
            character.levelUpTo(validLevel)

        props.game.playerTeam.add(character)
        } catch (error) {
            console.log(error)
            console.log('trouxa')
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <Box sx={{ gap: 1 }}>
                <Autocomplete
                    options={CharacterRegistry.getAllRegistered()}
                    renderInput={(params) => <TextField {...params} label="character" size="small" />}
                    sx={{ flex: 1 }}
                    value={characterName}
                    onChange={(_, value) => setCharacterName(value || "")}
                />
                <TextField sx={{ flex: 0.6 }} label="level" size="small" type="number" value={level} onChange={(ev) => setLevel(ev.target.value)} />
                <Button type="submit">spawn</Button>
            </Box>
        </form>
    )
}
