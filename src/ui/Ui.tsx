import React from "react"
import { Box, Button, ThemeProvider } from "@mui/material"
import { useMuiTheme } from "./hooks/useMuiTheme"
import { GameStateButtons } from "./GameStateButtons/GameStateButtons"
import { useGameScene } from "./hooks/useGameScene"
import { PlayerAugments } from "./CharacterSheet/PlayerAugments"
import { Recount } from "./Recount/Recount"
import { Counters } from "./Counters/Counters"
import { CharacterStoreDrawer } from "./CharacterStoreDrawer/CharacterStoreDrawer"
import { CharacterDrawer } from "./CharacterSheet/CharacerDrawer"
import { Traits } from "./Traits/Traits"
import { GameMenu } from "./GameMenu/GameMenu"
import { ItemTooltip } from "./ItemTooltip"
import { ItemAnvilModal } from "./ItemAnvilModal/ItemAnvilModal"
import { TavernDrawer } from "./Tavern/TavernDrawer"
import { Logo } from "./components/Logo"
import { DebugMenu } from "./DebugMenu/DebugMenu"

export const Ui: React.FC = () => {
    const theme = useMuiTheme()
    const game = useGameScene()

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 5,
                    paddingBottom: 15,
                    // border: "1px solid red",
                    pointerEvents: "none",
                    justifyContent: "space-between",
                }}
            >
                {game && (
                    <>
                        <Box sx={{ flexDirection: "column", height: 1, pointerEvents: "none", gap: 1 }}>
                            <ItemAnvilModal game={game} />
                            <PlayerAugments game={game} />
                            <DebugMenu game={game} />
                            <Traits game={game} />
                            <CharacterStoreDrawer game={game} />
                            <CharacterDrawer game={game} />
                            <TavernDrawer game={game} />
                        </Box>
                        <Box sx={{ flexDirection: "column", marginLeft: "auto" }}>
                            <Logo size={150} />
                            <Button
                                sx={{ pointerEvents: "auto", width: "min-content", alignSelf: "flex-end", marginTop: 1 }}
                                variant="outlined"
                                onClick={() => game.onPause()}
                            >
                                Menu
                            </Button>
                            <Counters game={game} />
                            <Recount game={game} />
                            <Box sx={{ flexDirection: "column", marginTop: "auto" }}>
                                <GameStateButtons game={game} />
                            </Box>
                        </Box>

                        <GameMenu game={game} />

                        <ItemTooltip />
                    </>
                )}
            </Box>
        </ThemeProvider>
    )
}
