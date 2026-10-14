import React, { useEffect, useRef, useState } from "react"
import { Badge, Box, Button, Divider, IconButton, Paper, Tooltip, Typography, useMediaQuery } from "@mui/material"
import { Close } from "@mui/icons-material"
import { Game } from "../../game/scenes/Game"
import { Item } from "../../game/systems/Items/Item"
import { EventBus } from "../../game/tools/EventBus"
import { INVENTORY_CATEGORIES, type InventoryCategory, type InventoryGroups } from "../../game/systems/Items/ItemInventoryLayout"
import { ItemIcon } from "../components/ItemIcon"
import { ItemTooltipContent } from "../components/ItemTooltipContent"
import { useInventoryDrag } from "./useInventoryDrag"

interface InventoryProps {
    game: Game
}

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
    artifact: "Artefato",
    completed: "Completo",
    component: "Componente",
}

export const Inventory: React.FC<InventoryProps> = ({ game }) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    const [open, setOpen] = useState(false)
    const [groups, setGroups] = useState<InventoryGroups<Item>>(() => game.availableItems.snapshot())
    const panelRef = useRef<HTMLDivElement | null>(null)

    const { startDrag, startDragTouch, draggingItemId } = useInventoryDrag({
        panelRef,
        canDrag: () => game.state === "idle",
        onReorder: (itemId, targetIndex) => game.availableItems.reorder(itemId, targetIndex),
    })

    useEffect(() => {
        const handler = (snapshot: InventoryGroups<Item>) => setGroups(snapshot)
        EventBus.on("inventory-change", handler)
        game.availableItems.emit()

        return () => {
            EventBus.off("inventory-change", handler)
        }
    }, [game])

    const columns = isMobile ? 3 : 4
    const total = groups.artifact.length + groups.completed.length + groups.component.length

    return (
        <Box sx={{ position: "relative", pointerEvents: "none" }}>
            <Box sx={{ pointerEvents: "auto", display: "flex" }}>
                <Tooltip title="Bolsa" placement="right">
                    <Button
                        variant="outlined"
                        color={open ? "primary" : "inherit"}
                        onClick={() => setOpen((current) => !current)}
                        sx={{ padding: 0.5, minWidth: 0, touchAction: "none" }}
                        aria-label="Abrir bolsa"
                    >
                        <Badge badgeContent={total} color="primary" overlap="circular">
                            <Box component="img" src="assets/ui/backpack.svg" alt="Bolsa" sx={{ width: isMobile ? 26 : 32, height: isMobile ? 26 : 32 }} />
                        </Badge>
                    </Button>
                </Tooltip>
            </Box>

            {open && (
                <Paper
                    ref={panelRef}
                    elevation={2}
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: "calc(100% + 8px)",
                        zIndex: 1200,
                        pointerEvents: "auto",
                        width: isMobile ? 220 : 280,
                        maxHeight: "70vh",
                        padding: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: 1 }}>
                        <Typography>Bolsa</Typography>
                        <IconButton onClick={() => setOpen(false)} size="small" aria-label="Fechar bolsa">
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    {total === 0 && (
                        <Typography variant="caption" color="text.secondary">
                            A bolsa está vazia.
                        </Typography>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, overflowY: "auto", paddingRight: 0.5 }}>
                        {INVENTORY_CATEGORIES.map((category) => (
                            <Box key={category} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="subtitle2">{CATEGORY_LABELS[category]}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {groups[category].length}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                        gap: 0.5,
                                        minHeight: isMobile ? 36 : 42,
                                    }}
                                >
                                    {groups[category].map((item, index) => (
                                        <Tooltip key={item.id} title={<ItemTooltipContent item={item} hideBackground />} placement="auto" disableInteractive>
                                            <Box
                                                data-inventory-slot={`${category}:${index}`}
                                                onPointerDown={(event) => startDrag(item, category, event)}
                                                onTouchStart={(event) => startDragTouch(item, category, event)}
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    cursor: game.state === "idle" ? "grab" : "default",
                                                    opacity: draggingItemId === item.id ? 0.35 : 1,
                                                    touchAction: "none",
                                                    WebkitUserSelect: "none",
                                                    userSelect: "none",
                                                }}
                                            >
                                                <ItemIcon itemKey={item.key} size={isMobile ? 34 : 40} />
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    )
}
