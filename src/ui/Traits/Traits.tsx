import React, { useEffect, useState } from "react"
import { Game } from "../../game/scenes/Game"
import { Trait } from "../../game/systems/Traits/Trait"
import { EventBus } from "../../game/tools/EventBus"
import { TraitList } from "./TraitList"

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

    return <TraitList traits={traits} />
}
