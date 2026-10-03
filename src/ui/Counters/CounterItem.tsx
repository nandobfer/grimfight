import React from 'react'
import {Box, Typography} from '@mui/material'

interface CounterItemProps {
    value: string | number
    color?: string
}

export const CounterItem:React.FC<CounterItemProps> = (props) => {
    
    return (
        <Box sx={{}}>
            <Typography variant='h5' sx={{ color: props.color, fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.5rem' } }}>{ props.value }</Typography>
        </Box>
    )
}
