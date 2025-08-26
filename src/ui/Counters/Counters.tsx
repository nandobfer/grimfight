import React from "react"
import { Avatar, Box } from "@mui/material"
import { CounterItem } from "./CounterItem"
import { GoldCoin } from "../components/GoldCoin"
import { usePlayerProgress } from "../hooks/usePlayerProgress"
import { Favorite } from "@mui/icons-material"

interface CountersProps {}

export const Counters: React.FC<CountersProps> = (props) => {
    const progress = usePlayerProgress()

    return (
        <Box sx={{ gap: 1, alignItems: "flex-end", flexDirection: "column" }}>
            <Box sx={{ gap: 1, alignItems: "center" }}>
                <Avatar src={"/assets/darkest_skull.webp"} sx={{ margin: -1 }} />
                <CounterItem value={progress.gameFloor} />
            </Box>
            <Box sx={{ gap: 1, alignItems: "center" }}>
                <Favorite color="error" />
                <CounterItem value={progress.playerLives} color="error.main" />
            </Box>
            <GoldCoin quantity={progress.playerGold} size={20} />
        </Box>
    )
}
