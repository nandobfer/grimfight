import React, { useState } from "react"
import { Box, TextField } from "@mui/material"
import { Game } from "../../game/scenes/Game"

interface DebugFloorProps {
    game: Game
    closeMenu: () => void
}

export const DebugGold: React.FC<DebugFloorProps> = (props) => {
    const [value, setValue] = useState('')

    const setGold = (gold: number) => {
            if (gold <= 0) return
            props.game.changePlayerGold(gold)
        }

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setGold(Number(value))
        setValue('')
        props.closeMenu()
    }

    return (
        <form onSubmit={(onSubmit)}>
            <TextField
                label='gold'
            value={value}
            onChange={(ev) => setValue(ev.target.value.replace(/\D/g, ""))}
            size="small"
            variant="standard"
        />
        </form>
    )
}
