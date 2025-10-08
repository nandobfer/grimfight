import React, { useState } from "react"
import { Box, TextField } from "@mui/material"
import { Game } from "../../game/scenes/Game"

interface DebugFloorProps {
    game: Game
    closeMenu: () => void
}

export const DebugSpeed: React.FC<DebugFloorProps> = (props) => {
    const [value, setValue] = useState("")

    const setSpeed = (speed: number) => {
        props.game.setGameSpeed(speed)
    }

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSpeed(Number(value))
        setValue("")
        props.closeMenu()
    }

    return (
        <form onSubmit={onSubmit}>
            <TextField
                type="number"
                label="speed"
                value={value}
                onChange={(ev) => setValue(ev.target.value.replace(/\D/g, ""))}
                size="small"
                variant="standard"
            />
        </form>
    )
}
