import { useEffect, useState } from "react"
import { EventBus } from "../game/EventBus"
import { Game } from "../game/scenes/Game"

export const useGameScene = () => {
    const [game, setGame] = useState<Game | null>(null)

    useEffect(() => {
        const handler = (game: Game) => setGame(game)
        EventBus.on("game-ready", handler)

        return () => {
            EventBus.off("game-ready", handler)
        }
    }, [])

    return game
}
