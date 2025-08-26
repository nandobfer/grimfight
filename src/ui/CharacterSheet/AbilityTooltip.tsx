import React from 'react'
import { Box, PopperProps, Tooltip } from "@mui/material"

interface AbilityTooltipProps {
    description: string
    children: React.ReactElement<unknown, any>
    placement: PopperProps["placement"]
}

export const AbilityTooltip:React.FC<AbilityTooltipProps> = (props) => {
    
    return (
        <Tooltip title={props.description} placement={props.placement} slotProps={{ popper: { sx: { pointerEvents: "none" } } }}>
            {props.children}
        </Tooltip>
    )
}