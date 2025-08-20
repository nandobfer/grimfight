import React, { useMemo } from 'react'
import {Avatar, Box, LinearProgress, Typography} from '@mui/material'
import { DamageMeter } from '../../game/tools/DamageChart'

interface DamageBarProps {
    meter: DamageMeter
    highest_damage: number
}

export const DamageBar: React.FC<DamageBarProps> = (props) => {
    const value = useMemo(() => (props.meter.damage/(props.highest_damage || 100)) * 100, [props.meter, props.highest_damage])

    return (
        <Box sx={{gap: 1, alignItems: 'center'}} color='primary.main'>
            <Avatar sx={{width: 20, aspectRatio: 1, height: 'auto', bgcolor: 'transparent', color: 'primary.main'}}>{ props.meter.character.name[0] }</Avatar>
            <LinearProgress variant='determinate' sx={{width: 1}} value={value} color='primary' />
            <Typography variant='caption' fontSize={10} >{ props.meter.damage }</Typography>
        </Box>
    )
}