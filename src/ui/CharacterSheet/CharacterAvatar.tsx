import React from 'react'
import {Avatar} from '@mui/material'

interface CharacterAvatarProps {
    name: string
    size: number
    variant?: "circular" | "rounded" | "square"
}

export const CharacterAvatar:React.FC<CharacterAvatarProps> = (props) => {
    
    return (
        <Avatar
            variant={props.variant}
            src={`/assets/portraits/${props.name}.webp`}
            sx={{
                bgcolor: "primary.main",
                width: props.size,
                aspectRatio: 1,
                height: "auto",
                alignSelf: "center",
                pointerEvents: "none",
                color: "primary.main",
            }}
        />
    )
}