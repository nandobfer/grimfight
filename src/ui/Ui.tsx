import React, { useEffect, useState } from "react"
import { Box, ThemeProvider } from "@mui/material"
import { EventBus } from "../game/EventBus"
import { useMuiTheme } from "../hooks/useMuiTheme"
import { GameStateButtons } from "./GameStateButtons/GameStateButtons"
import { NewCharacterModal } from "./NewCharacterModal/NewCharacterModal"
import { useGameScene } from "../hooks/useGameScene"
import { CharactersRow } from "./CharacterSheet/CharactersRow"

interface UiProps {}

export const Ui: React.FC<UiProps> = (props) => {
    const theme = useMuiTheme()
    const game = useGameScene()
    const [chooseCharacterModalOpen, setChooseCharacterModalOpen] = useState(false)

    const handleFirstCharacterEmitted = () => {
        setChooseCharacterModalOpen(true)
    }

    useEffect(() => {
        EventBus.on("choose-character", handleFirstCharacterEmitted)

        return () => {
            EventBus.off("choose-character", handleFirstCharacterEmitted)
        }
    }, [])
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
                    border: "1px solid red",
                    pointerEvents: "none",
                    justifyContent: "space-between",
                }}
            >
                {game && (
                    <>
                        <CharactersRow charactersGroup={game.playerTeam} />
                        <GameStateButtons game={game} />
                    </>
                )}
            </Box>

            <NewCharacterModal open={chooseCharacterModalOpen} handleClose={() => setChooseCharacterModalOpen(false)} />
        </ThemeProvider>
    )
}
