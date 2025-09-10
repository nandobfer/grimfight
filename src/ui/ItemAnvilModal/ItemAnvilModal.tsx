import React, { useEffect, useState } from "react"
import { Box, Button, Dialog, useMediaQuery } from "@mui/material"
import { EventBus } from "../../game/tools/EventBus"
import { Item } from "../../game/systems/Items/Item"
import { Game } from "../../game/scenes/Game"
import { ItemTooltipContent } from "../components/ItemTooltipContent"

interface ItemAnvilModalProps {
    game: Game
}

export const ItemAnvilModal: React.FC<ItemAnvilModalProps> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")

    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<Item[]>([])

    const handleClose = () => {
        setOpen(false)
    }

    const onChoose = (item: Item) => {
        handleClose()
        props.game.availableItems.add(item)
        item.dropOnBoard()
    }

    useEffect(() => {
        const handler = (items: Item[]) => {
            setOpen(true)
            setItems(items)
        }

        EventBus.on("choose-item-anvil", handler)
        return () => {
            EventBus.off("choose-item-anvil", handler)
        }
    }, [])

    return (
        <>
            {/* {augmentAvailable && (
                <Button variant="outlined" sx={{ pointerEvents: "auto" }} onClick={() => setOpen(true)} color="success">
                    Aprimoramento disponível!
                </Button>
            )} */}

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
                    {items.map((item, index) => (
                        <Button sx={{padding: 0}} variant="outlined" onClick={() => onChoose(item)}>
                            <ItemTooltipContent item={item} key={item.key + index} />
                        </Button>
                    ))}
                </Box>
            </Dialog>
        </>
    )
}
