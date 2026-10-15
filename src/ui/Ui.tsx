import React from "react"
import { Box, IconButton, ThemeProvider, Tooltip } from "@mui/material"
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
import { DebugMenu } from "./DebugMenu/DebugMenu"
import { Menu } from "@mui/icons-material"

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
                    padding: { xs: 1, sm: 3, md: 5 },
                    paddingBottom: { xs: 10, sm: 12, md: 15 },
                    // border: "1px solid red",
                    pointerEvents: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                {game && (
                    <>
                        <Box sx={{ display: "flex", flexDirection: "column", height: 1, pointerEvents: "none", gap: 1 }}>
                            <ItemAnvilModal game={game} />
                            <PlayerAugments game={game} />
                            <DebugMenu game={game} />
                            <Traits game={game} />
                            <CharacterStoreDrawer game={game} />
                            <CharacterDrawer game={game} />
                            <TavernDrawer game={game} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "auto", gap: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: { xs: 0.5, sm: 1 }, pointerEvents: "auto" }}>
                                <Counters game={game} />
                                <Tooltip title="Menu" placement="auto">
                                    <IconButton color="inherit" size="small" onClick={() => game.onPause()} aria-label="Open menu">
                                        <Menu fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <GameStateButtons game={game} />
                            <Recount game={game} />
                        </Box>

                        <GameMenu game={game} />

                        <ItemTooltip />
                    </>
                )}
            </Box>
        </ThemeProvider>
    )
}
