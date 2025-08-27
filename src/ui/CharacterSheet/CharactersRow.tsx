import React, { useEffect, useState } from "react"
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material"
import { EventBus } from "../../game/tools/EventBus"
import { Game, max_characters_in_board } from "../../game/scenes/Game"
import { Augment } from "../../game/systems/Augment/Augment"
import { renderTokensDescription } from "../../game/tools/TokenizedText"
import { Character } from "../../game/creature/character/Character"
import { AugmentModal } from "../AugmentModal/AugmentModal"
import { DebugMenu } from "../DebugMenu/DebugMenu"

interface CharactersRowProps {
    game: Game
}

export const CharactersRow: React.FC<CharactersRowProps> = (props) => {
    const [charactersLength, setCharactersLength] = useState(0)
    const [augments, setAugments] = useState(Array.from(props.game.playerTeam.augments.values()))
    const [openTooltip, setOpenTooltip] = React.useState<boolean>(false)

    const showTooltip = () => {
        setOpenTooltip(true)
    }

    const hideTooltip = () => {
        setOpenTooltip(false)
    }

    useEffect(() => {
        const charactersHandler = (characters: Character[]) => {
            setCharactersLength(characters.length)
        }
        const augmentsHandler = (augments: Augment[]) => {
            setAugments([...augments])
        }

        const addAgument = (augment: Augment) => {
            setAugments((augments) => [...augments, augment])
        }

        EventBus.on("characters-change", charactersHandler)
        EventBus.on("augments-add", addAgument)
        EventBus.on("augments-change", augmentsHandler)

        return () => {
            EventBus.off("characters-change", charactersHandler)
            EventBus.off("augments-add", addAgument)
            EventBus.off("augments-change", augmentsHandler)
        }
    }, [])

    return (
        <Box
            sx={{
                pointerEvents: "auto",
                flexDirection: "column",
                gap: 1,
            }}
        >
            <AugmentModal team={props.game.playerTeam} />
            <Tooltip
                disableHoverListener
                onMouseEnter={() => showTooltip()}
                onClick={() => showTooltip()}
                onMouseLeave={() => hideTooltip()}
                open={openTooltip || false}
                title={
                    augments.length > 0 && (
                        <Box sx={{ gap: 1, flexWrap: "wrap", overflowY: "auto" }}>
                            {augments.map((augment, index) => (
                                <Tooltip
                                    placement="auto"
                                    title={renderTokensDescription(augment.descriptionValues, augment.description)}
                                    key={augment.name + index.toString()}
                                >
                                    <Chip label={augment.name} size="small" onClick={() => null} color={augment.color} />
                                </Tooltip>
                            ))}
                        </Box>
                    )
                }
            >
                <Button variant="outlined">Aprimoramentos x{augments.length}</Button>
            </Tooltip>

            <Box sx={{ alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: "bold", marginBottom: 1, marginTop: 1 }}>
                    {charactersLength} / {max_characters_in_board}
                </Typography>
                <DebugMenu game={props.game} />
            </Box>
        </Box>
    )
}
