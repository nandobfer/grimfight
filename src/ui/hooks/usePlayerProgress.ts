import { useEffect, useState } from "react"
import { GameProgressDto } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"

export const usePlayerProgress = () => {
    const [playerGold, setPlayerGold] = useState(0)
    const [gameFloor, setGameFloor] = useState(1)
    const [playerLives, setPlayerLives] = useState(5)

    useEffect(() => {
        const handleFloorChange = (floor: number) => setGameFloor(floor)
        const handleGoldChange = (gold: number) => setPlayerGold(gold)
        const handleLivesChange = (lives: number) => setPlayerLives(lives)
        const handleLoadProgress = (progress: GameProgressDto) => {
            setGameFloor(progress.floor)
            setPlayerGold(progress.playerGold)
            setPlayerLives(progress.playerLives)
        }

        EventBus.on("floor-change", handleFloorChange)
        EventBus.on("lives-change", handleLivesChange)
        EventBus.on("gold-change", handleGoldChange)
        EventBus.on("load-progress", handleLoadProgress)
        EventBus.emit("get-progress")

        return () => {
            EventBus.off("floor-change", handleFloorChange)
            EventBus.off("lives-change", handleLivesChange)
            EventBus.off("gold-change", handleGoldChange)
            EventBus.off("load-progress", handleLoadProgress)
        }
    }, [])

    return { playerGold, playerLives, gameFloor }
}
