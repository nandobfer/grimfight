import React from 'react'
import { Box, PopperProps, Tooltip } from "@mui/material"
import { renderDescription } from "../../game/tools/TokenizedText"

interface AbilityTooltipProps {
    description: string
    children: React.ReactElement<unknown, any>
    placement: PopperProps["placement"]
}

export const AbilityTooltip: React.FC<AbilityTooltipProps> = (props) => {
    return (
        <Tooltip
            title={renderDescription(props.description)}
            placement={props.placement}
            slotProps={{ popper: { sx: { pointerEvents: "none" } }, tooltip: { sx: { whiteSpace: "pre-wrap" } } }}
        >
            {props.children}
        </Tooltip>
    )
}