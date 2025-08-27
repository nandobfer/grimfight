import React from "react"
import { Button, Paper, Typography } from "@mui/material"
import { Augment } from "../../game/systems/Augment/Augment"
import { renderTokensDescription } from "../../game/tools/TokenizedText"

interface AugmentCardProps {
    augment: Augment
    onChoose: (augment: Augment) => void
}

export const AugmentCard: React.FC<AugmentCardProps> = (props) => {
    return (
        <Button sx={{ padding: 0, flexShrink: 0 }} onClick={() => props.onChoose(props.augment)} variant="outlined">
            <Paper sx={{ flexDirection: "column", gap: 1, padding: 1, width: 300, minHeight: 100 }} elevation={5}>
                <Typography variant="body1" fontWeight={"bold"} color="primary">
                    {props.augment.name}
                </Typography>
                <Typography variant="body2">{renderTokensDescription(props.augment.descriptionValues, props.augment.description)}</Typography>
            </Paper>
        </Button>
    )
}
