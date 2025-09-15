import React from 'react'
import {Avatar, Box} from '@mui/material'

interface LogoProps {
    
}

export const Logo:React.FC<LogoProps> = (props) => {
    
    return (
        <Avatar
            variant="square"
            src="grimfight.png"
            sx={{ width: 600, height: "auto", marginTop: -17, marginBottom: -20, marginLeft: -2, marginRight: -2 }}
        />
    )
}