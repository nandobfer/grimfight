import React, { useState } from "react"
import { Box, TextField } from "@mui/material"
import { Game } from "../../game/scenes/Game"

interface DebugFloorProps {
    game: Game
    closeMenu: () => void
}

export const DebugFloor: React.FC<DebugFloorProps> = (props) => {
    const [value, setValue] = useState("")

    const setFloor = (floor: number) => {
        if (floor <= 0) return
        props.game.floor = floor - 1
        props.game.onFloorDefeated()
    }

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFloor(Number(value))
        setValue("")
        props.closeMenu()
    }

    return (
        <form onSubmit={onSubmit}>
            <TextField
                type="number"
                label="floor"
                value={value}
                onChange={(ev) => setValue(ev.target.value.replace(/\D/g, ""))}
                size="small"
                variant="standard"
            />
        </form>
    )
}
