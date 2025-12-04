import React from 'react'
import {Avatar, Box} from '@mui/material'

interface LogoProps {
    size?: number
}

export const Logo: React.FC<LogoProps> = (props) => {
    return <Avatar variant="square" src="grimfight.png" sx={{ width: props.size || 600, height: "auto" }} />
}