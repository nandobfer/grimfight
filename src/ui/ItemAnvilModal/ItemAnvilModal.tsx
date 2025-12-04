import React, { useEffect, useState } from "react"
import { Box, Button, Dialog, useMediaQuery } from "@mui/material"
import { EventBus } from "../../game/tools/EventBus"
import { Item } from "../../game/systems/Items/Item"
import { Game } from "../../game/scenes/Game"
import { ItemTooltipContent } from "../components/ItemTooltipContent"
import { ItemRegistry } from "../../game/systems/Items/ItemRegistry"

interface ItemAnvilModalProps {
    game: Game
}

export const ItemAnvilModal: React.FC<ItemAnvilModalProps> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")

    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<Item[]>([])
    const [anvilAvailable, setAnvilAvailable] = useState(false)

    const handleClose = () => {
        setOpen(false)
    }

    const onChoose = (chosenItem: Item) => {
        handleClose()
        const item = ItemRegistry.create(chosenItem.key, props.game)
        props.game.availableItems.add(item)
        item.dropOnBoard()
        setAnvilAvailable(false)
    }

    useEffect(() => {
        const handler = (items: Item[]) => {
            setOpen(true)
            setAnvilAvailable(true)
            setItems(items)
        }

        EventBus.on("choose-item-anvil", handler)
        EventBus.emit("ui-anvil")
        return () => {
            EventBus.off("choose-item-anvil", handler)
        }
    }, [])

    return (
        <>
            {anvilAvailable && (
                <Button
                    variant="outlined"
                    sx={{
                        pointerEvents: "auto",
                        animation: "shinyPulse 2s ease-in-out infinite",
                        boxShadow: "0 0 15px rgba(76, 175, 80, 0.6)",
                        "@keyframes shinyPulse": {
                            "0%, 100%": {
                                boxShadow: "0 0 15px rgba(76, 175, 80, 0.6), 0 0 25px rgba(76, 175, 80, 0.4)",
                            },
                            "50%": {
                                boxShadow: "0 0 25px rgba(76, 175, 80, 0.9), 0 0 40px rgba(76, 175, 80, 0.6), 0 0 60px rgba(76, 175, 80, 0.3)",
                            },
                        },
                        "&:hover": {
                            animation: "none",
                            boxShadow: "0 0 20px rgba(76, 175, 80, 0.8)",
                        },
                    }}
                    onClick={() => setOpen(true)}
                    color="success"
                >
                    Choose an item!
                </Button>
            )}

            <Dialog open={open} onClose={handleClose} slotProps={{ paper: { elevation: 0, style: { backgroundColor: "transparent" } } }}>
                <Box
                    sx={{
                        gap: 1,
                        maxWidth: "75vw",
                        maxHeight: "75vh",
                        overflow: "auto",
                        margin: -2,
                        padding: 2,
                        flexDirection: isMobile ? "column" : "row",
                    }}
                >
                    {items.map((item) => (
                        <Button
                            key={item.id}
                            color={ItemRegistry.isArtifact(item) ? "error" : "info"}
                            sx={{ padding: 0, height: 1 }}
                            variant="outlined"
                            onClick={() => onChoose(item)}
                        >
                            <ItemTooltipContent item={item} />
                        </Button>
                    ))}
                </Box>
            </Dialog>
        </>
    )
}
