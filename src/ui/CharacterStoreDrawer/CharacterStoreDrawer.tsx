import React, { useEffect, useState } from "react"
import { Box, Button, ClickAwayListener, Divider, Drawer, IconButton, MenuItem, Paper, SwipeableDrawer, useMediaQuery } from "@mui/material"
import { Game, GameState } from "../../game/scenes/Game"
import { StoreList } from "./StoreList"
import { Close, ExpandMore, Refresh } from "@mui/icons-material"
import { EventBus } from "../../game/tools/EventBus"
import { usePlayerProgress } from "../hooks/usePlayerProgress"
import { GoldCoin } from "../components/GoldCoin"
import { BenchList } from "./BenchList"

interface CharacterStoreDrawerProps {
    game: Game
}

const drawerBleeding = 80

export const CharacterStoreDrawer: React.FC<CharacterStoreDrawerProps> = ({ game }) => {
    const { playerGold } = usePlayerProgress()
    const isMobile = useMediaQuery("(orientation: portrait)")

    const [open, setOpen] = useState(true)
    const [gamestate, setGamestate] = useState<GameState>("idle")

    const closeStore = () => {
        setOpen(false)
    }

    const shuffle = () => {
        game.playerTeam.store.shuffle(false)
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
                openStore()
            }
        }

        EventBus.on("gamestate", handler)
        EventBus.on("open-store", openStore)

        return () => {
            EventBus.off("gamestate", handler)
            EventBus.off("open-store", openStore)
        }
    }, [])

    return (
        <Box sx={{ display: "contents" }}>
            <Button
                variant="contained"
                onClick={toggleStore}
                sx={{ pointerEvents: "auto", marginTop: "auto", width: 100 }}
                disabled={gamestate === "fighting"}
            >
                Loja
            </Button>
            <SwipeableDrawer
                open={open}
                onOpen={openStore}
                onClose={closeStore}
                anchor="bottom"
                variant="persistent"
                keepMounted
                swipeAreaWidth={drawerBleeding}
                disableSwipeToOpen={false}
                ModalProps={{ keepMounted: true }}
                slotProps={{
                    paper: {
                        elevation: 1,
                        sx: {
                            width: isMobile ? "100vw" : "65vw",
                            // height: "20vh",
                            bgcolor: "background.default",
                            overflow: "visible",
                            margin: "0 auto",
                            flexDirection: "column",
                            pointerEvents: "auto",
                        },
                    },
                }}
            >
                <Paper
                    sx={{
                        position: "absolute",
                        visibility: "visible",
                        width: isMobile ? "100vw" : "65vw",
                        top: -drawerBleeding,
                        height: drawerBleeding,
                        borderRadius: 0,
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        flexDirection: "column",
                    }}
                >
                    <MenuItem
                        onClick={toggleStore}
                        sx={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
                            padding: 0,
                            whiteSpace: "normal",
                            marginBottom: -1,
                        }}
                    >
                        <ExpandMore fontSize="small" sx={{ transform: !open ? "rotate(180deg)" : undefined, transition: "0.3s" }} />
                    </MenuItem>
                    <Divider />
                    <BenchList game={game} />
                </Paper>

                <Divider />
                <Box sx={{ width: 1 }}>
                    <StoreList game={game} playerGold={playerGold} />
                    <Box sx={{ flexDirection: "column", alignItems: "center" }}>
                        {/* <IconButton color="primary" onClick={closeStore}>
                            <Close />
                        </IconButton> */}
                        <Box
                            sx={{
                                flexDirection: "column",
                                alignItems: "center",
                                filter: playerGold < 2 ? "grayscale(100%)" : undefined,
                                flex: 1,
                            }}
                        >
                            <IconButton color="primary" onClick={shuffle} disabled={playerGold < 2} sx={{}}>
                                <Refresh />
                            </IconButton>
                            <GoldCoin quantity={2} fontSize={10} size={6} />
                        </Box>
                    </Box>
                </Box>
            </SwipeableDrawer>
        </Box>
    )
}
