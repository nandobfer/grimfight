import React from "react"
import { Avatar, Button, Tooltip } from "@mui/material"
import { Item } from "../../game/systems/Items/Item"
import { ItemTooltipContent } from "../components/ItemTooltipContent"

interface ItemContainerProps {
    item: Item
}

export const ItemContainer: React.FC<ItemContainerProps> = ({ item }) => {
    const onClick = () => {
        if (item.user) {
            item.user.unequipItem(item)
            item.dropOnBoard()
        }
    }
    return (
        <Tooltip title={<ItemTooltipContent item={item} hideBackground />} placement="auto" disableInteractive>
            <Button sx={{ padding: 0, minWidth: 0 }} variant="outlined" onClick={onClick}>
                <Avatar variant="rounded" src={`/assets/items/${item.key}.png`} sx={{ width: 30, aspectRatio: 1, height: "auto" }} />
            </Button>
        </Tooltip>
    )
}
