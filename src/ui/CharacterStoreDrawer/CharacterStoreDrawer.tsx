import React, { useEffect, useState } from "react"
import { Box, Button, Drawer, IconButton } from "@mui/material"
import { Game, GameState } from "../../game/scenes/Game"
import { StoreList } from "./StoreList"
import { Close, Refresh } from "@mui/icons-material"
import { GoldCoin } from "../components/GoldCoin"
import { EventBus } from "../../game/tools/EventBus"

interface CharacterStoreDrawerProps {
    game: Game
}

export const CharacterStoreDrawer: React.FC<CharacterStoreDrawerProps> = ({ game }) => {
    const [open, setOpen] = useState(true)
    const [gamestate, setGamestate] = useState<GameState>("idle")

    const closeStore = () => {
        setOpen(false)
    }

    const openStore = () => {
        setOpen(true)
    }

    const toggleStore = () => {
        setOpen((value) => !value)
    }

    useEffect(() => {
        const handler = (state: GameState) => {
            setGamestate(state)
            if (state === "idle") {
                setOpen(true)
            }
        }

        EventBus.on("gamestate", handler)

        return () => {
            EventBus.off("gamestate", handler)
        }
    }, [])

    return (
        <>
            <Button variant="contained" onClick={toggleStore} sx={{ pointerEvents: "auto", marginTop: "auto" }} disabled={gamestate === "fighting"}>
                Loja
            </Button>

            <Drawer
                open={gamestate === "fighting" ? false : open}
                onClose={closeStore}
                anchor="bottom"
                variant="persistent"
                keepMounted
                ModalProps={{ keepMounted: true }}
                slotProps={{
                    paper: {
                        elevation: 1,
                        sx: {
                            width: "65vw",
                            // height: "20vh",
                            bgcolor: "background.default",
                            overflow: "visible",
                            margin: "0 auto",
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
                            flexDirection: "row",
                            pointerEvents: "auto",
                        },
                    },
                }}
            >
                <StoreList game={game} />
                <Box sx={{ flexDirection: "column", alignItems: "center" }}>
                    <IconButton color="primary" onClick={closeStore}>
                        <Close />
                    </IconButton>
                </Box>
            </Drawer>
        </>
    )
}
