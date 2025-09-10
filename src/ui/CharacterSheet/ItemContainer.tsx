import React, { useState } from "react"
import { Avatar, Button, Tooltip } from "@mui/material"
import { Item } from "../../game/systems/Items/Item"
import { ItemTooltipContent } from "../components/ItemTooltipContent"
import { ItemIcon } from "../components/ItemIcon"

interface ItemContainerProps {
    item: Item
}

export const ItemContainer: React.FC<ItemContainerProps> = ({ item }) => {
    const [showTooltip, setShowTooltip] = useState(false)

    const openTooltip = () => {
        setShowTooltip(true)
    }

    const hideTooltip = () => {
        setShowTooltip(false)
    }

    const onClick = () => {
        if (item.user) {
            item.user.unequipItem(item)
            item.dropOnBoard()
        }
    }

    return (
        <Tooltip
            title={<ItemTooltipContent item={item} hideBackground />}
            placement="auto"
            disableInteractive
            open={showTooltip}
            onMouseEnter={() => openTooltip()}
            onClick={() => openTooltip()}
            onMouseLeave={() => hideTooltip()}
        >
            <Button sx={{ padding: 0, minWidth: 0 }} variant="outlined" onClick={onClick}>
                <ItemIcon itemKey={item.key} />
            </Button>
        </Tooltip>
    )
}
