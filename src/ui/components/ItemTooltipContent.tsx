import React from "react"
import { Avatar, Box, Divider, Paper, Typography } from "@mui/material"
import { Item } from "../../game/systems/Items/Item"
import { ItemRegistry } from "../../game/systems/Items/ItemRegistry"
import { ItemIcon } from "./ItemIcon"
import { ItemRecipe } from "./ItemRecipe"

interface ItemTooltipContentProps {
    item: Item
    hideBackground?: boolean
}

export const ItemTooltipContent: React.FC<ItemTooltipContentProps> = ({ item, hideBackground }) => {
    const isComponent = ItemRegistry.isComponent(item)
    const recipes = ItemRegistry.getComponentRecipes(item.key)

    return (
        <Paper
            elevation={hideBackground ? 0 : undefined}
            sx={{
                padding: hideBackground ? 0 : 1,
                flexDirection: "column",
                gap: 1,
                bgcolor: hideBackground ? "transparent" : undefined,
                paddingTop: hideBackground ? 0.5 : undefined,
                maxWidth: 200,
                height: 1,
            }}
        >
            <Box sx={{ alignItems: "center", gap: 1 }}>
                <ItemIcon itemKey={item.key} />
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

            {isComponent && (
                <>
                    <Divider />
                    <Box sx={{ flexDirection: "column", gap: 0.5 }}>
                        {recipes.map((recipe, index) => (
                            <ItemRecipe recipe={recipe} key={recipe.result + index} game={item.scene} />
                        ))}
                    </Box>
                </>
            )}
        </Paper>
    )
}
