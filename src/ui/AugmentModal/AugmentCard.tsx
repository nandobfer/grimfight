import React from "react"
import { Box, Button, Paper, Typography } from "@mui/material"
import { Augment } from "../../game/systems/Augment/Augment"

interface AugmentCardProps {
    augment: Augment
    onChoose: (augment: Augment) => void
}

export const AugmentCard: React.FC<AugmentCardProps> = (props) => {
    return (
        <Button sx={{ padding: 0, flexShrink: 0, }} variant="outlined" onClick={() => props.onChoose(props.augment)}>
            <Paper sx={{ flexDirection: "column", gap: 1, padding: 1, width: 300 }} elevation={5}>
                <Typography variant="body1" fontWeight={"bold"}>
                    {props.augment.name}
                </Typography>
                <Typography variant="body2">{props.augment.description}</Typography>
            </Paper>
        </Button>
    )
}
