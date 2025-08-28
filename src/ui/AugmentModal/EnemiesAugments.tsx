import React, { useEffect, useMemo, useState } from "react"
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Collapse, MenuItem, Typography } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { Augment } from "../../game/systems/Augment/Augment"
import { EventBus } from "../../game/tools/EventBus"
import { renderTokensDescription } from "../../game/tools/TokenizedText"
import { ExpandMore } from "@mui/icons-material"

interface EnemiesAugmentsProps {
    game: Game
}

export const EnemiesAugments: React.FC<EnemiesAugmentsProps> = (props) => {
    const [augments, setAugments] = useState(Array.from(props.game.enemyTeam.augments.values()))
    const [open, setOpen] = useState(false)

    const flatenedAugments = useMemo(() => {
        const list: Augment[] = []

        for (const augment of augments) {
            const index = list.findIndex((item) => item.name === augment.name)
            if (index > -1) {
                for (const [key, value] of Object.entries(list[index].values)) {
                    list[index].values[key] = value
                }
            } else {
                list.push(augment)
            }
        }
        return list
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
        <Box sx={{ flexDirection: "column", color: "error.main", width: "min-content", }}>
            <Button
                color="error"
                onClick={() => setOpen((value) => !value)}
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    whiteSpace: "normal",
                    pointerEvents: "auto",
                }}
                endIcon={<ExpandMore sx={{transform: open ? 'rotate(180deg)' : undefined, transition: '0.3s'}} />}
            >
                <Typography variant="subtitle2" fontWeight={"bold"}>
                    Inimigos estão mais fortes:
                </Typography>
            </Button>
            <Collapse in={open}>
                {flatenedAugments.map((augment) => (
                    <Box key={augment.name} sx={{ gap: 1 , width: 300}}>
                        <Typography variant="subtitle2">{augment.name}:</Typography>
                        <Typography variant="caption" >
                            {renderTokensDescription(augment.descriptionValues, augment.description)}
                        </Typography>
                    </Box>
                ))}
            </Collapse>
        </Box>
    ) : null
}
