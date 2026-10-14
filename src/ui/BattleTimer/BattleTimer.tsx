import React, { useEffect, useState } from "react"
import { Box, Chip, Typography } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { BattleTimerSnapshot } from "../../game/systems/BattleTimer"
import { EventBus } from "../../game/tools/EventBus"

interface BattleTimerProps {
    game: Game
}

/**
 * HUD countdown for the current battle. The scene owns the timing rule and
 * pushes snapshots through the EventBus; this component only renders the last
 * snapshot and shows the overtime multiplier once the time runs out.
 */
export const BattleTimer: React.FC<BattleTimerProps> = (props) => {
    const [snapshot, setSnapshot] = useState<BattleTimerSnapshot>(() => props.game.getBattleTimerSnapshot())

    useEffect(() => {
        const handler = (next: BattleTimerSnapshot) => setSnapshot(next)
        EventBus.on("battle-timer", handler)

        return () => {
            EventBus.off("battle-timer", handler)
        }
    }, [])

    if (!snapshot.active) return null

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 32,
                pointerEvents: "none",
            }}
        >
            {snapshot.expired ? (
                <Chip size="small" color="error" label={`${snapshot.speedMultiplier}×`} />
            ) : (
                <Typography variant="h5" color="text.primary" sx={{ fontVariantNumeric: "tabular-nums", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                    {Math.ceil(snapshot.remainingMs / 1000)}
                </Typography>
            )}
        </Box>
    )
}
