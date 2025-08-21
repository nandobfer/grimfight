import React from 'react'
import {Avatar} from '@mui/material'

interface CharacterAvatarProps {
    name: string
    size: number
    disabled?: boolean
}

export const CharacterAvatar:React.FC<CharacterAvatarProps> = (props) => {
    
    return (
        <Avatar
            src={`/assets/portraits/${props.name}.webp`}
            sx={{ bgcolor: "primary.main", width: props.size, aspectRatio: 1, height: "auto", alignSelf: "center", pointerEvents: "none" }}
        />
    )
}