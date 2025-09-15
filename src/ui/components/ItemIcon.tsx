import React from "react"
import { Avatar, Box } from "@mui/material"

interface ItemIconProps {
    itemKey: string
    size?: number
    highlight?: boolean
}

export const ItemIcon: React.FC<ItemIconProps> = ({ itemKey, size = 30, highlight }) => {
    return (
        <Avatar
            variant="rounded"
            src={`assets/items/${itemKey}.png`}
            sx={{
                width: size,
                height: size,
                outline: highlight ? 2 : undefined,
            }}
        />
    )
}
