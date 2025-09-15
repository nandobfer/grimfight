import React, { useEffect, useState } from "react"
import { Popper } from "@mui/material"
import { Item, PointerPosition } from "../game/systems/Items/Item"
import { EventBus } from "../game/tools/EventBus"
import { ItemTooltipContent } from "./components/ItemTooltipContent"

interface ItemTooltipProps {}

export const ItemTooltip: React.FC<ItemTooltipProps> = (props) => {
    const [item, setItem] = useState<Item | null>(null)
    const [position, setPosition] = useState<PointerPosition | null>(null)
    const [anchorEl, setAnchorEl] = useState<null | (() => HTMLElement)>(null)

    // assume pos.clientX / pos.clientY are viewport coords (MouseEvent.clientX/Y)
    // If your event gives pageX/pageY, convert: client = page - scroll.

    useEffect(() => {
        const handle = (item: Item | null, pos?: PointerPosition & { clientX?: number; clientY?: number }) => {
            setItem(item)
            if (item && pos) {
                const left = pos.clientX ?? pos.x // ensure these are CLIENT coords
                const top = pos.clientY ?? pos.y

                // Virtual anchor at the cursor (viewport space)
                const virtualEl = {
                    getBoundingClientRect: () => new DOMRect(left, top, 0, 0),
                    // helps Popper when computing styles
                    contextElement: document.body,
                } as unknown as HTMLElement

                setAnchorEl(() => virtualEl)
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
            placement="right-start" // stable side (no auto-flip)
            //   strategy="fixed"            // use viewport, not layout flow
            modifiers={[
                { name: "offset", options: { offset: [10, 10] } },
                { name: "flip", options: { fallbackPlacements: ["left-start", "top", "bottom"], padding: 8 } },
                { name: "preventOverflow", options: { boundary: "viewport", padding: 8, altAxis: true, tether: true } },
                { name: "computeStyles", options: { adaptive: false } }, // reduces “jump” when size changes
            ]}
            sx={{
                pointerEvents: "none",
                zIndex: 9999,
            }}
        >
            {item && <ItemTooltipContent item={item} />}
        </Popper>
    )
}
