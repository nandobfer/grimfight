import React from "react"
import { Avatar, Box, Button, Tooltip, Typography } from "@mui/material"
import { Trait } from "../../game/systems/Traits/Trait"
import { renderTraitDescription } from "../../game/systems/Traits/TraitDescriptionHelpers"

interface TraitComponentProps {
    trait: Trait
}

export const TraitComponent: React.FC<TraitComponentProps> = (props) => {
    const trait = props.trait
    const active = trait.activeStage > 0

    return (
        <Tooltip
            placement="auto"
            title={
                <Box sx={{ flexDirection: "column" }}>
                    <Typography fontWeight={"bold"} variant="subtitle2">
                        {trait.name}
                    </Typography>
                    <Typography variant="caption">{renderTraitDescription(trait)}</Typography>
                </Box>
            }
        >
            <Box sx={{ gap: 1, alignItems: "center", width: 'fit-content' }}>
                <Button
                    sx={{ padding: 0, transform: "rotate(45deg)", pointerEvents: "auto", minWidth: 0 }}
                    color={active ? "success" : "primary"}
                    variant={active ? "contained" : "outlined"}
                >
                    <Avatar
                        variant="square"
                        sx={{ transform: "rotate(-45deg)", aspectRatio: 1, height: "auto", width: 20, bgcolor: "transparent" }}
                    />
                </Button>
                <Typography variant="caption" fontWeight={"bold"}>
                    {trait.charactersCount} / {trait.maxStage}
                </Typography>
            </Box>
        </Tooltip>
    )
}
