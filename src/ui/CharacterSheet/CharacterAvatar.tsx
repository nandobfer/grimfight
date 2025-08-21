import React from 'react'
import {Avatar} from '@mui/material'

interface CharacterAvatarProps {
    name: string
    size: number
}

export const CharacterAvatar:React.FC<CharacterAvatarProps> = (props) => {
    
    return (
        <Avatar src={`/assets/avatars/${props.name}.png`} sx={{ bgcolor: "primary.main", width: props.size, aspectRatio: 1, height: "auto", alignSelf: 'center' }} />
    )
}