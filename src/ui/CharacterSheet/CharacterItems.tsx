import React from "react"
import { Box } from "@mui/material"
import { Item } from "../../game/systems/Items/Item"
import { ItemContainer } from "./ItemContainer"

interface CharacterItemsProps {
    items: Item[]
}

export const CharacterItems: React.FC<CharacterItemsProps> = (props) => {
    return (
        <Box sx={{ gap: 1, alignItems: "center" }}>
            {props.items.map((item, index) => (
                <ItemContainer item={item} key={item.key + index} />
            ))}
        </Box>
    )
}
