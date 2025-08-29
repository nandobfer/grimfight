import React from "react"
import { Avatar, Box, Button, Tooltip, Typography } from "@mui/material"
import { Trait } from "../../game/systems/Traits/Trait"
import { renderTraitDescription } from "../../game/systems/Traits/TraitDescriptionHelpers"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"

interface TraitComponentProps {
    trait: Trait
}

export const TraitComponent: React.FC<TraitComponentProps> = (props) => {
    const trait = props.trait
    const active = trait.activeStage > 0

    return (
        <Tooltip
            placement="auto"
            title={
                <Box sx={{ flexDirection: "column" }}>
                    <Typography fontWeight={"bold"} variant="subtitle2">
                        {trait.name}
                    </Typography>
                    <Typography variant="caption">{renderTraitDescription(trait)}</Typography>

                    <Box sx={{ marginTop: 1, gap: 1 }}>
                        {trait.comp.map((characterName) => (
                            <Box sx={{ filter: trait.activeComp.has(characterName) ? undefined : "grayscale(100%)" }}>
                                <CharacterAvatar name={characterName} size={30} key={characterName} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            }
        >
            <Box sx={{ gap: 1, alignItems: "center", width: "fit-content" }}>
                <Button
                    sx={{ padding: 0, transform: "rotate(45deg)", pointerEvents: "auto", minWidth: 0 }}
                    color={active ? "success" : "primary"}
                    variant={active ? "contained" : "outlined"}
                >
                    <Avatar
                        variant="square"
                        sx={{ transform: "rotate(-45deg)", aspectRatio: 1, height: "auto", width: 20, bgcolor: "transparent" }}
                    />
                </Button>
                <Box sx={{ flexDirection: "column" }}>
                    <Typography variant="subtitle2">{trait.name}</Typography>
                    {!!trait.activeComp.size && (
                        <Typography variant="caption" fontWeight={"bold"}>
                            {trait.activeComp.size} / {trait.maxStage}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Tooltip>
    )
}
