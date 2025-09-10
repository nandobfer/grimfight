import React from "react"
import { Box } from "@mui/material"
import { ItemRegistry, Recipe } from "../../game/systems/Items/ItemRegistry"
import { ItemIcon } from "./ItemIcon"
import { Add, ArrowRightAlt, HorizontalRule } from "@mui/icons-material"
import { Game } from "../../game/scenes/Game"

interface ItemRecipeProps {
    recipe: Recipe
    game: Game
}

export const ItemRecipe: React.FC<ItemRecipeProps> = ({ recipe, game }) => {
    const charactersItems = game.playerTeam
        .getChildren()
        .map((char) => Array.from(char.items.values()))
        .flatMap((item) => item)
    const items = [...Array.from(game.availableItems.values()), ...charactersItems.filter((item) => ItemRegistry.isComponent(item))]

    const isAvailable = (component: string) => {
        return !!items.find((item) => item.key === component)
    }

    const isPossible = () => {
        if (recipe.components[0] === recipe.components[1]) {
            return items.filter((item) => item.key === recipe.components[0]).length >= 2
        } else {
            return !!(items.find((item) => item.key === recipe.components[0]) && items.find((item) => item.key === recipe.components[1]))
        }
    }

    return (
        <Box sx={{ gap: 1 }}>
            <ItemIcon itemKey={recipe.components[0]} size={20} highlight={isAvailable(recipe.components[0])} />
            <Add fontSize="small" />
            <ItemIcon itemKey={recipe.components[1]} size={20} highlight={isAvailable(recipe.components[1])} />
            <ArrowRightAlt />
            <ItemIcon itemKey={recipe.result} size={20} highlight={isPossible()} />
        </Box>
    )
}
