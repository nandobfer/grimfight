import React, { useEffect, useState } from "react"
import { Avatar, Box, Divider, Paper, Popper, Typography } from "@mui/material"
import { Item, PointerPosition } from "../game/systems/Items/Item"
import { EventBus } from "../game/tools/EventBus"

interface ItemTooltipProps {}

export const ItemTooltip: React.FC<ItemTooltipProps> = (props) => {
    const [item, setItem] = useState<Item | null>(null)
    const [position, setPosition] = useState<PointerPosition | null>(null)
    const [anchorEl, setAnchorEl] = useState<null | (() => HTMLElement)>(null)

    useEffect(() => {
        const handle = (item: Item | null, pos?: PointerPosition) => {
            setItem(item)
            if (item && pos) {
                setPosition(pos)

                // Create a virtual anchor element at the mouse position
                setAnchorEl(() => {
                    const virtualElement = {
                        getBoundingClientRect: () => ({
                            width: 0,
                            height: 0,
                            top: pos.y,
                            left: pos.x,
                            right: pos.x,
                            bottom: pos.y,
                            x: pos.x,
                            y: pos.y,
                            toJSON: () => null,
                        }),
                    }
                    return virtualElement as unknown as HTMLElement
                })
            } else {
                setAnchorEl(null)
            }
        }

        EventBus.on("item-tooltip", handle)

        return () => {
            EventBus.off("item-tooltip", handle)
        }
    }, [])

    return (
        <Popper
            open={!!item}
            anchorEl={anchorEl as any}
            placement="auto"
            modifiers={[
                {
                    name: "offset",
                    options: {
                        offset: [40, 300], // Offset from the cursor
                    },
                },
                {
                    name: "preventOverflow",
                    options: {
                        boundary: "viewport",
                        padding: 8,
                    },
                },
            ]}
            sx={{
                pointerEvents: "none",
                zIndex: 9999,
            }}
        >
            {item && (
                <Paper sx={{ padding: 1, flexDirection: "column", gap: 1 }}>
                    <Box sx={{alignItems: 'center', gap: 1}}>
                        <Avatar variant="rounded" src={`/assets/items/${item.key}.png`} sx={{width: 30, aspectRatio: 1, height: 'auto'}} />
                        <Typography fontWeight={"bold"} fontSize={14} color="primary.main">
                        {item.name}
                    </Typography>
                    </Box>
                    <Divider />
                    {item.descriptionLines.map((line, index) => (
                        <Typography key={line + index} fontSize={12}>
                            {line}
                        </Typography>
                    ))}
                </Paper>
            )}
        </Popper>
    )
}
