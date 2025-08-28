import React, { useEffect, useMemo, useState } from "react"
import { Box, Button, Collapse, Typography } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { Augment } from "../../game/systems/Augment/Augment"
import { EventBus } from "../../game/tools/EventBus"
import { ExpandMore } from "@mui/icons-material"

interface EnemiesAugmentsProps {
    game: Game
}

export const EnemiesAugments: React.FC<EnemiesAugmentsProps> = (props) => {
    const [augments, setAugments] = useState(Array.from(props.game.enemyTeam.augments.values()))
    const [open, setOpen] = useState(false)

    const flatenedAugments = useMemo(() => {
        const counter = new Map<string, number>()

        for (const aug of augments) {
            const quantity = counter.get(aug.name)
            if (!quantity) {
                counter.set(aug.name, 1)
            } else {
                counter.set(aug.name, quantity + 1)
            }
        }

        return Array.from(counter.entries())
    }, [augments])

    useEffect(() => {
        const augmentsHandler = (augments: Augment[]) => {
            setAugments([...augments])
        }

        const addAgument = (augment: Augment) => {
            setAugments((augments) => [...augments, augment])
        }

        EventBus.on("enemies-augments-add", addAgument)
        EventBus.on("enemies-augments-change", augmentsHandler)

        return () => {
            EventBus.off("enemies-augments-add", addAgument)
            EventBus.off("enemies-augments-change", augmentsHandler)
        }
    }, [])

    return augments.length > 0 ? (
        <Box sx={{ flexDirection: "column", color: "error.main", width: "min-content", pointerEvents: "none" }}>
            <Button
                color="error"
                onClick={() => setOpen((value) => !value)}
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    whiteSpace: "normal",
                    pointerEvents: "auto",
                }}
                endIcon={<ExpandMore sx={{ transform: open ? "rotate(180deg)" : undefined, transition: "0.3s" }} />}
            >
                <Typography variant="subtitle2" fontWeight={"bold"}>
                    Inimigos estão mais fortes:
                </Typography>
            </Button>
            <Collapse in={open}>
                {flatenedAugments.map((augment) => (
                    <Box key={augment[0]} sx={{ gap: 1, width: 250, justifyContent: "end" }}>
                        <Typography variant="caption">{augment[0]}:</Typography>
                        <Typography variant="subtitle2">{augment[1]}x</Typography>
                    </Box>
                ))}
            </Collapse>
        </Box>
    ) : null
}
