import React, { useEffect, useState } from "react"
import { Box } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { Trait } from "../../game/systems/Traits/Trait"
import { EventBus } from "../../game/tools/EventBus"
import { TraitComponent } from "./TraitComponent"

interface TraitsProps {
    game: Game
}

export const Traits: React.FC<TraitsProps> = (props) => {
    const [traits, setTraits] = useState(props.game.playerTeam.activeTraits)

    useEffect(() => {
        const updateTraits = (traits: Trait[]) => {
            console.log(traits)
            setTraits([...traits])
        }

        EventBus.on("active-traits", updateTraits)

        return () => {
            EventBus.off("active-traits", updateTraits)
        }
    }, [])

    return (
        <Box sx={{ flexDirection: "column", gap: 1 }}>
            {traits.map((trait) => (
                <TraitComponent key={trait.name} trait={trait} />
            ))}
        </Box>
    )
}
