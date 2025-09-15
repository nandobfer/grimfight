import React from 'react'
import {Avatar} from '@mui/material'

interface CharacterAvatarProps {
    name: string
    size: number
    variant?: "circular" | "rounded" | "square"
    highlight?: boolean
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = (props) => {
    return (
        <Avatar
            variant={props.variant}
            src={`assets/portraits/${props.name}.webp`}
            sx={{
                bgcolor: props.highlight ? "info.main" : "primary.main",
                width: props.size,
                aspectRatio: 1,
                height: "auto",
                alignSelf: "center",
                pointerEvents: "none",
                color: "primary.main",
                // outline: props.highlight ? 3 : undefined,
                // outlineColor: "secondary.main",
            }}
        />
    )
}