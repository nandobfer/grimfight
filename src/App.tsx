import { useEffect, useRef, useState } from "react"
import { IRefPhaserGame, PhaserGame } from "./PhaserGame"
import { Ui } from "./ui/Ui"
import { EventBus } from "./game/tools/EventBus"
import { MainMenu } from "./ui/MainMenu/MainMenu"
import { PreviewPage } from "./preview/PreviewPage"
import { isPreviewRoute } from "./preview/previewRoute"

type AppState = "menu" | "loading" | "playing"

function App() {
    if (isPreviewRoute(window.location.pathname)) {
        return <PreviewPage />
    }

    return <GameApp />
}

function GameApp() {
    const [appState, setAppState] = useState<AppState>("menu")
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null)

    // Event emitted from the PhaserGame component
    const currentScene = (_scene: Phaser.Scene) => {}

    useEffect(() => {
        const quitToMenu = () => {
            phaserRef.current = null
            setAppState("menu")
        }
        const finishLoading = () => {
            setAppState((current) => (current === "loading" ? "playing" : current))
        }
        EventBus.on("quit-to-menu", quitToMenu)
        EventBus.on("load-complete", finishLoading)

        return () => {
            EventBus.off("quit-to-menu", quitToMenu)
            EventBus.off("load-complete", finishLoading)
        }
    }, [])

    return (
        <div id="app" onDragOver={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}>
            {(appState === "loading" || appState === "playing") && <PhaserGame key="phaser-game" ref={phaserRef} currentActiveScene={currentScene} />}
            {(appState === "menu" || appState === "loading") && (
                <MainMenu
                    key="main-menu"
                    isLoading={appState === "loading"}
                    onNewGame={() => setAppState("loading")}
                    onContinue={() => setAppState("loading")}
                />
            )}
            {(appState === "loading" || appState === "playing") && <Ui />}
        </div>
    )
}

export default App
