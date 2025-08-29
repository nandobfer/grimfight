import React, { useEffect, useState } from "react"
import { Box, Button, Dialog, Typography } from "@mui/material"
import { PlayerTeam } from "../../game/creature/character/PlayerTeam"
import { Augment } from "../../game/systems/Augment/Augment"
import { EventBus } from "../../game/tools/EventBus"
import { AugmentCard } from "./AugmentCard"
import { AugmentsRegistry } from "../../game/systems/Augment/AugmentsRegistry"
import { Refresh } from "@mui/icons-material"

interface AugmentModalProps {
    team: PlayerTeam
}

export const AugmentModal: React.FC<AugmentModalProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [augments, setAugments] = useState<Augment[]>([])
    const [augmentAvailable, setAugmentAvailable] = useState(false)
    const [refreshed, setRefreshed] = useState(false)

    const handleClose = () => {
        setOpen(false)
    }

    const onChoose = (augment: Augment) => {
        props.team.addAugment(augment)
        handleClose()
        setAugmentAvailable(false)
        setRefreshed(false)
    }

    const refreshAugments = () => {
        const augments = AugmentsRegistry.randomList(3)
        setAugments(augments)
        setRefreshed(true)
    }

    useEffect(() => {
        const handler = (augments: Augment[]) => {
            setOpen(true)
            setRefreshed(false)
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
                <Button variant="outlined" sx={{ pointerEvents: "auto" }} onClick={() => setOpen(true)} color="success">
                    Aprimoramento disponível!
                </Button>
            )}

            <Dialog open={open} onClose={handleClose} slotProps={{ paper: { elevation: 0, style: { backgroundColor: "transparent" } } }}>
                <Button variant="outlined" endIcon={<Refresh />} disabled={refreshed} onClick={refreshAugments}>
                    Shuffle
                </Button>
                <Box sx={{ gap: 1, maxWidth: "75vw", overflow: "auto", margin: -2, padding: 2 }}>
                    {augments.map((augment, index) => (
                        <AugmentCard augment={augment} key={augment.name + index.toString()} onChoose={onChoose} />
                    ))}
                </Box>
            </Dialog>
        </>
    )
}
