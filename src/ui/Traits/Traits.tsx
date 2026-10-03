import React, { useEffect, useState } from "react"
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material"
import { Close, FormatListBulleted } from "@mui/icons-material"
import { Game } from "../../game/scenes/Game"
import { Trait } from "../../game/systems/Traits/Trait"
import { EventBus } from "../../game/tools/EventBus"
import { TraitList } from "./TraitList"

interface TraitsProps {
    game: Game
}

export const Traits: React.FC<TraitsProps> = (props) => {
    const [traits, setTraits] = useState(props.game.playerTeam.activeTraits)
    const [expanded, setExpanded] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

    useEffect(() => {
        const updateTraits = (traits: Trait[]) => {
            setTraits([...traits])
        }

        EventBus.on("active-traits", updateTraits)

        return () => {
            EventBus.off("active-traits", updateTraits)
        }
    }, [])

    const showTraits = !isMobile || expanded

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, pointerEvents: "auto" }}>
            {isMobile && (
                <Tooltip title={expanded ? "Recolher traits" : "Expandir traits"} placement="auto">
                    <IconButton color="inherit" size="small" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse traits" : "Expand traits"}>
                        {expanded ? <Close fontSize="small" /> : <FormatListBulleted fontSize="small" />}
                    </IconButton>
                </Tooltip>
            )}
            {showTraits && <TraitList traits={traits} />}
        </Box>
    )
}
