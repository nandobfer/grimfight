import React from "react"
import { Avatar, Box, Tooltip } from "@mui/material"
import { CounterItem } from "./CounterItem"
import { GoldCoin } from "../components/GoldCoin"
import { usePlayerProgress } from "../hooks/usePlayerProgress"
import { Favorite } from "@mui/icons-material"
import { Game } from "../../game/scenes/Game"

interface CountersProps {
    game: Game
}

export const Counters: React.FC<CountersProps> = (props) => {
    const progress = usePlayerProgress()

    return (
        <Box sx={{ gap: 1, alignItems: "flex-end", flexDirection: "column", pointerEvents: "auto" }}>
            <Tooltip title="Dungeon Floor" placement="auto">
                <Box sx={{ gap: 1, alignItems: "center" }}>
                    <Avatar src={"/assets/darkest_skull.webp"} sx={{ margin: -1 }} />
                    <CounterItem value={progress.gameFloor} />
                </Box>
            </Tooltip>
            <Tooltip title="Player Health" placement="auto">
                <Box sx={{ gap: 1, alignItems: "center" }}>
                    <Favorite color="error" />
                    <CounterItem value={progress.playerLives} color="error.main" />
                </Box>
            </Tooltip>
            <Tooltip title="Gold Coins" placement="auto">
                <Box id="gold-coin-counter">
                    <GoldCoin quantity={progress.playerGold} size={20} />
                </Box>
            </Tooltip>
        </Box>
    )
}
