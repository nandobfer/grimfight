import React, { useState } from "react"
import { Box, Button, Paper, Typography } from "@mui/material"
import { Augment } from "../../game/systems/Augment/Augment"
import { renderTokensDescription } from "../../game/tools/TokenizedText"
import { Refresh } from "@mui/icons-material"
import { AugmentsRegistry } from "../../game/systems/Augment/AugmentsRegistry"

interface AugmentCardProps {
    augment: Augment
    onChoose: (augment: Augment) => void
}

export const AugmentCard: React.FC<AugmentCardProps> = (props) => {
    const [augment, setAugment] = useState(props.augment)
    const [refreshed, setRefreshed] = useState(false)

    const refresh = () => {
        setAugment(AugmentsRegistry.random())
        setRefreshed(true)
    }

    return (
        <Box sx={{ flexDirection: "column", gap: 1 }}>
            <Button sx={{ padding: 0, flexShrink: 0 }} onClick={() => props.onChoose(augment)} variant="outlined">
                <Paper sx={{ flexDirection: "column", gap: 1, padding: 1, width: 300, minHeight: 100 }} elevation={5}>
                    <Typography variant="body1" fontWeight={"bold"} color="primary">
                        {augment.name}
                    </Typography>
                    <Typography variant="body2">{renderTokensDescription(augment.descriptionValues, augment.description)}</Typography>
                </Paper>
            </Button>
            <Button variant="outlined" disabled={refreshed} onClick={refresh}>
                <Refresh />
            </Button>
        </Box>
    )
}
