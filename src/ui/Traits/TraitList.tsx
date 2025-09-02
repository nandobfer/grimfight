import React from "react"
import { Box } from "@mui/material"
import { Trait } from "../../game/systems/Traits/Trait"
import { TraitComponent } from "./TraitComponent"

interface TraitListProps {
    traits: Trait[]
    row?: boolean
}

export const TraitList: React.FC<TraitListProps> = (props) => {
    const traits = props.traits
    return (
        <Box sx={{ flexDirection: props.row ? "row" : "column", gap: 1 }}>
            {traits
                .sort((a, b) => b.activeStage - a.activeStage)
                .map((trait) => (
                    <TraitComponent key={trait.name} trait={trait} />
                ))}
        </Box>
    )
}
