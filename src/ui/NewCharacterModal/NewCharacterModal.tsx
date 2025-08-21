import React, { useMemo } from "react"
import { Box, Dialog, Typography } from "@mui/material"
import { CharacterRegistry } from "../../game/creature/CharacterRegistry"
import { NewCharacterContainer } from "./NewCharacterContainer"
import { useGameScene } from "../../hooks/useGameScene"
import { CharacterDto } from "../../game/creature/character/Character"

interface NewCharacterModalProps {
    open: boolean
    handleClose: () => void
}

export const NewCharacterModal: React.FC<NewCharacterModalProps> = (props) => {
    const game = useGameScene()

    const classes = useMemo(() => {
        if (!game) return []

        const characters: CharacterDto[] = []

        const availableCharacters = CharacterRegistry.getAllRegistered()
        for (const name of availableCharacters) {
            const character = CharacterRegistry.create(name, game, Phaser.Utils.String.UUID())
            characters.push(character.getDto())
            character.destroy(true)
        }

        return characters
    }, [game])

    const onChooseCharacter = (dto: CharacterDto) => {
        game?.newPlayerCharacter(dto)
        props.handleClose()
    }

    return (
        <Dialog open={props.open} onClose={props.handleClose}>
            <Typography variant="h6" color="primary.main" fontWeight={"bold"}>
                new character
            </Typography>
            <Box sx={{ gap: 1, maxWidth: "75vw", overflow: "auto", margin: -2, padding: 2 }}>
                {classes.map((character) => (
                    <NewCharacterContainer character={character} key={character.id} onChoose={onChooseCharacter} />
                ))}
            </Box>
        </Dialog>
    )
}
