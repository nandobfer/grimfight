import React, { useState } from "react"
import { Box, Button, Drawer, IconButton } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { StoreList } from "./StoreList"
import { Close, Refresh } from "@mui/icons-material"
import { GoldCoin } from "../components/GoldCoin"

interface CharacterStoreDrawerProps {
    game: Game
}

export const CharacterStoreDrawer: React.FC<CharacterStoreDrawerProps> = ({ game }) => {
    const [open, setOpen] = useState(false)

    const closeStore = () => {
        setOpen(false)
    }

    const openStore = () => {
        setOpen(true)
    }

    const toggleStore = () => {
        setOpen((value) => !value)
    }

    

    return (
        <>
            <Button variant="contained" onClick={toggleStore}>
                Loja
            </Button>

            <Drawer
                open={open}
                onClose={closeStore}
                anchor="bottom"
                variant="persistent"
                keepMounted
                ModalProps={{ keepMounted: true }}
                slotProps={{
                    paper: {
                        elevation: 1,
                        sx: {
                            width: "min-content",
                            // height: "20vh",
                            bgcolor: "background.default",
                            overflow: "visible",
                            margin: "0 auto",
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
                            flexDirection: "row",
                        },
                    },
                }}
            >
                
                <StoreList game={game} />
                <Box sx={{ flexDirection: "column", alignItems: "center" }}>
                    <IconButton color="primary" size="small" onClick={closeStore}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            </Drawer>
        </>
    )
}
