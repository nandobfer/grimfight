import React, { useState } from "react"
import { Box, TextField } from "@mui/material"
import { Game } from "../../game/scenes/Game"

interface DebugFloorProps {
    game: Game
}

export const DebugFloor: React.FC<DebugFloorProps> = (props) => {
    const [value, setValue] = useState('')

    const setFloor = (floor: number) => {
            if (floor <= 0) return
            props.game.floor = floor - 1
            props.game.clearFloor()
        }

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFloor(Number(value))
        setValue('')
    }

    return (
        <form onSubmit={(onSubmit)}>
            <TextField
                label='floor'
            value={value}
            onChange={(ev) => setValue(ev.target.value.replace(/\D/g, ""))}
            size="small"
            sx={{ width: "9vw" }}
            variant="standard"
        />
        </form>
    )
}
