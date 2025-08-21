import React from "react"
import { Box } from "@mui/material"
import { CounterItem } from "./CounterItem"
import { GoldCoin } from "../components/GoldCoin"
import { usePlayerProgress } from "../hooks/usePlayerProgress"

interface CountersProps {}

export const Counters: React.FC<CountersProps> = (props) => {
    const progress = usePlayerProgress()

    return (
        <Box sx={{ gap: 1, alignItems: "flex-end", flexDirection: "column" }}>
            <CounterItem value={progress.gameFloor} />
            <CounterItem value={progress.playerLives} color="error.main" />
            <GoldCoin quantity={progress.playerGold} size={20} />
        </Box>
    )
}
