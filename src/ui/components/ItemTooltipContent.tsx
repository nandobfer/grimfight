import React from "react"
import { Avatar, Box, Divider, Paper, Typography } from "@mui/material"
import { Item } from "../../game/systems/Items/Item"

interface ItemTooltipContentProps {
    item: Item
}

export const ItemTooltipContent: React.FC<ItemTooltipContentProps> = ({ item }) => {
    return (
        <Paper sx={{ padding: 1, flexDirection: "column", gap: 1,  }}>
            <Box sx={{ alignItems: "center", gap: 1 }}>
                <Avatar variant="rounded" src={`/assets/items/${item.key}.png`} sx={{ width: 30, aspectRatio: 1, height: "auto" }} />
                <Typography fontWeight={"bold"} fontSize={14} color="primary.main">
                    {item.name}
                </Typography>
            </Box>
            <Divider />
            {item.descriptionLines.map((line, index) => (
                <Typography key={line + index} fontSize={12} sx={{ maxWidth: 300 }}>
                    {line}
                </Typography>
            ))}
        </Paper>
    )
}
