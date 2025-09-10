import React, { useState } from "react"
import { Box, PopperProps, Tooltip } from "@mui/material"
import { renderDescription } from "../../game/tools/TokenizedText"
import { Trait } from "../../game/systems/Traits/Trait"
import { TraitList } from "../Traits/TraitList"

interface AbilityTooltipProps {
    description: string
    children: React.ReactElement<unknown, any>
    placement: PopperProps["placement"]
    traits?: Trait[]
}

export const AbilityTooltip: React.FC<AbilityTooltipProps> = (props) => {
    const [showTooltip, setShowTooltip] = useState(false)

    const openTooltip = () => {
        setShowTooltip(true)
    }

    const hideTooltip = () => {
        setShowTooltip(false)
    }

    return (
        <Tooltip
            title={
                <>
                    {props.traits && (
                        <Box sx={{ flexDirection: "column" }}>
                            <TraitList traits={props.traits} row />
                            <br />
                        </Box>
                    )}
                    {renderDescription(props.description)}
                </>
            }
            placement={props.placement}
            slotProps={{ popper: { sx: { pointerEvents: "none" } }, tooltip: { sx: { whiteSpace: "pre-wrap" } } }}
            open={showTooltip}
            onMouseEnter={() => openTooltip()}
            onClick={() => openTooltip()}
            onMouseLeave={() => hideTooltip()}
        >
            {props.children}
        </Tooltip>
    )
}
