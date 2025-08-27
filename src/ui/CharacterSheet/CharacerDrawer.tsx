import React, { useEffect, useState } from "react"
import { Box, Button, ClickAwayListener, Drawer, useMediaQuery } from "@mui/material"
import { Character } from "../../game/creature/character/Character"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterSheet } from "./CharacterSheet"

interface CharacterDrawerProps {
    store: CharacterStore
}

export const CharacterDrawer: React.FC<CharacterDrawerProps> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    const openingRef = React.useRef(false)

    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

    const handleClose = () => {
        setSelectedCharacter(null)
    }

    const handleClickAway = () => {
        if (openingRef.current) return // ignore the click that opened it
        handleClose()
    }

    const sellCharacter = (id: string) => {
        props.store.sell(id)
        handleClose()
    }

    useEffect(() => {
        const selectChar = (char: Character) => {
            setSelectedCharacter(char)
            openingRef.current = true
            setTimeout(() => {
                openingRef.current = false
            }, 0)
        }

        // EventBus.on("characters-change", charactersHandler)
        EventBus.on("select-char", selectChar)

        return () => {
            // EventBus.off("characters-change", charactersHandler)
            EventBus.off("select-char", selectChar)
        }
    }, [])

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <Box sx={{ display: "contents" }}>
                <Drawer
                    open={!!selectedCharacter}
                    onClose={handleClose}
                    anchor="left"
                    variant="persistent"
                    slotProps={{
                        paper: {
                            elevation: 1,
                            sx: {
                                height: "40vh",
                                overflow: "visible",
                                pointerEvents: "auto",
                                marginTop: isMobile ? "20vh" : "30vh",
                                padding: 2,
                                gap: 1,
                                flexDirection: "column",
                                width: isMobile ? 150 : 200,
                                overflowY: "auto",
                                borderTopRightRadius: 10,
                                borderBottomRightRadius: 10,
                            },
                        },
                    }}
                >
                    {selectedCharacter && <CharacterSheet character={selectedCharacter} store={props.store} sell={sellCharacter} />}
                </Drawer>
            </Box>
        </ClickAwayListener>
    )
}
