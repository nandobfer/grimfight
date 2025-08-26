import React, { useEffect, useState } from "react"
import { Box, Button, Dialog, Typography } from "@mui/material"
import { CharacterGroup } from "../../game/creature/character/CharacterGroup"
import { Augment } from "../../game/systems/Augment/Augment"
import { EventBus } from "../../game/tools/EventBus"
import { AugmentCard } from "./AugmentCard"

interface AugmentModalProps {
    team: CharacterGroup
}

export const AugmentModal: React.FC<AugmentModalProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [augments, setAugments] = useState<Augment[]>([])
    const [augmentAvailable, setAugmentAvailable] = useState(false)

    const handleClose = () => {
        setOpen(false)
    }

    const onChoose = (augment: Augment) => {
        props.team.addAugment(augment)
        handleClose()
        setAugmentAvailable(false)
    }

    useEffect(() => {
        const handler = (augments: Augment[]) => {
            setOpen(true)
            setAugmentAvailable(true)
            setAugments(augments)
        }

        EventBus.on("choose-augment", handler)
        EventBus.emit("ui-augment")
        return () => {
            EventBus.off("choose-augment", handler)
        }
    }, [])

    return (
        <>
            {augmentAvailable && (
                <Button variant="outlined" sx={{ pointerEvents: "auto" }} onClick={() => setOpen(true)}>
                    Aprimoramento disponível!
                </Button>
            )}
            <Dialog open={open} onClose={handleClose} slotProps={{ paper: { elevation: 0, style: { backgroundColor: "transparent" } } }}>
                <Box sx={{ gap: 1, maxWidth: "75vw", overflow: "auto", margin: -2, padding: 2 }}>
                    {augments.map((augment) => (
                        <AugmentCard augment={augment} key={augment.name} onChoose={onChoose} />
                    ))}
                </Box>
            </Dialog>
        </>
    )
}
