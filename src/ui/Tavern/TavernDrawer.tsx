import React, { useEffect, useMemo, useState } from "react"
import { Box, ClickAwayListener, Drawer, IconButton, Paper, Typography, useMediaQuery } from "@mui/material"
import { Character, CharacterDto } from "../../game/creature/character/Character"
import { EventBus } from "../../game/tools/EventBus"
import { Game } from "../../game/scenes/Game"
import { CharacterGroup } from "./CharacterGroup"
import { Close } from "@mui/icons-material"
import { useCharacterBridge } from "../hooks/useCharacterBridge"

interface TavernDrawerProps {
    game: Game
}

export const TavernDrawer: React.FC<TavernDrawerProps> = (props) => {
    const tavern = props.game.tavern
    const store = props.game.playerTeam.store

    const isMobile = useMediaQuery("(orientation: portrait)")
    const openingRef = React.useRef(false)
    const benchBridge = useCharacterBridge()

    const [open, setOpen] = useState(false)
    const [summonedCharactersLength, setSummonedCharactersLength] = useState(props.game.playerTeam?.getChildren()?.length || 0)

    const [characters, setCharacters] = useState<CharacterDto[]>(tavern.bench.characters)
    const uniqueCharacters = useMemo(() => {
        const map = new Map<string, CharacterDto[]>()
        for (const char of characters) {
            const list = map.get(char.name) || []
            list.push(char)
            map.set(
                char.name,
                list.sort((a, b) => b.level - a.level)
            )
        }
        return Array.from(map.entries()).sort(([_, a], [__, b]) => b[0].level - a[0].level)
    }, [characters])

    const summonedCharsLengthHandler = (characters: Character[]) => {
        setSummonedCharactersLength(characters.length)
    }

    const handleClose = () => {
        setOpen(false)
    }

    const handleOpen = () => {
        openingRef.current = true
        setTimeout(() => {
            openingRef.current = false
        }, 0)

        setOpen(true)
    }

    const handleClickAway = () => {
        // if (openingRef.current) return // ignore the click that opened it
        // handleClose()
    }

    const handleBenchUpdate = (characters: CharacterDto[]) => {
        setCharacters([...characters])
    }

    useEffect(() => {
        EventBus.on("characters-change", summonedCharsLengthHandler)
        EventBus.on("toggle-bench", handleOpen)
        EventBus.on("character-bench", handleBenchUpdate)

        return () => {
            EventBus.off("characters-change", summonedCharsLengthHandler)
            EventBus.off("toggle-bench", handleOpen)
            EventBus.off("character-bench", handleBenchUpdate)
        }
    }, [])

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <Box sx={{ display: "contents" }}>
                <Drawer
                    open={open}
                    onClose={handleClose}
                    anchor="left"
                    variant="persistent"
                    slotProps={{
                        paper: {
                            ref: benchBridge.wrapperRef,
                            elevation: 1,
                            sx: {
                                height: "min-content",
                                overflow: "visible",
                                pointerEvents: open ? "auto" : "none",
                                marginTop: isMobile ? "20vh" : "30vh",
                                padding: 2,
                                gap: 1,
                                flexDirection: "column",
                                width: isMobile ? 150 : 200,
                                borderTopRightRadius: 10,
                                borderBottomRightRadius: 10,
                            },
                        },
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Typography>Tavern</Typography>
                        <IconButton onClick={handleClose} sx={{}} size="small">
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    <Typography variant="subtitle2">
                        Summoned: {summonedCharactersLength} / {props.game.max_characters_in_board}
                    </Typography>

                    <Box
                        sx={{
                            flexDirection: "column",
                            gap: 1,
                            margin: -2,
                            marginTop: 0,
                            opacity: benchBridge.preview ? 0.5 : 1,
                            maxHeight: "40vh",
                            overflowY: "auto",
                        }}
                    >
                        {uniqueCharacters.map(([key, chars]) => (
                            <CharacterGroup
                                key={key}
                                name={key}
                                characters={chars}
                                tavern={tavern}
                                store={store}
                                summonedCharactersLength={summonedCharactersLength}
                            />
                        ))}
                    </Box>
                    {benchBridge.preview && (
                        <Paper sx={{ position: "absolute", top: 0, left: 0, justifyContent: "center", alignItems: "center", width: 1, height: 1 }}>
                            <Typography variant="body2">Drop to bench</Typography>
                        </Paper>
                    )}
                </Drawer>
            </Box>
        </ClickAwayListener>
    )
}
