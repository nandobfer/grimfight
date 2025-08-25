import React from 'react'
import {Box, Tooltip} from '@mui/material'

interface AbilityTooltipProps {
    description: string
    children: React.ReactElement<unknown, any>
}

export const AbilityTooltip:React.FC<AbilityTooltipProps> = (props) => {
    
    return (
        <Tooltip title={props.description} placement='auto' >
            {props.children}
        </Tooltip>
    )
}