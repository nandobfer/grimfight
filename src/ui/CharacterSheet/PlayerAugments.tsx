import React from "react"
import { Game } from "../../game/scenes/Game"
import { AugmentModal } from "../AugmentModal/AugmentModal"

interface CharactersRowProps {
    game: Game
}

export const PlayerAugments: React.FC<CharactersRowProps> = (props) => {
    return <AugmentModal team={props.game.playerTeam} />
}
