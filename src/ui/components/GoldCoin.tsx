import React from 'react'
import {Avatar, Box, Typography} from '@mui/material'

interface GoldCoinProps {
    size?: number
    quantity: number
    fontSize?: number
    reverted?: boolean
}

export const GoldCoin:React.FC<GoldCoinProps> = (props) => {
    
    return (
        <Box sx={{alignItems: 'center', gap: 1, flexDirection: props.reverted ? 'row-reverse' : undefined}}>
            <Avatar src='/assets/gold.gif' sx={{width: props.size, aspectRatio: 1, height: 'auto'}} />
            <Typography variant='h5' fontWeight={'bold'} fontSize={props.fontSize} color='warning'>{ props.quantity }</Typography>
        </Box>
    )
}