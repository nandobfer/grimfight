import React, { useEffect, useMemo, useRef, useState } from "react"
import { Badge, Box, Button, Tooltip, useMediaQuery } from "@mui/material"
import { CharacterDto } from "../../game/creature/character/Character"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { Game } from "../../game/scenes/Game"
import { GoldCoin } from "../components/GoldCoin"
import { AbilityTooltip } from "../CharacterSheet/AbilityTooltip"
import { EventBus } from "../../game/tools/EventBus"

interface BenchItemProps {
    character?: CharacterDto
    game: Game
}

export function usePhaserDragBridge() {
    const ctrlRef = useRef<AbortController | null>(null)
    const [dragging, setDragging] = useState(false)

    // unmount cleanup (covers mid-drag unmounts)
    useEffect(() => () => ctrlRef.current?.abort(), [])

    const startDrag = (dto: CharacterDto, e: React.PointerEvent) => {
        setDragging(true)
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)

        EventBus.emit("ui-drag-start", { dto, clientX: e.clientX, clientY: e.clientY })

        const ctrl = new AbortController()
        ctrlRef.current = ctrl
        const { signal } = ctrl

        const onMove = (ev: PointerEvent) => {
            EventBus.emit("ui-drag-move", { clientX: ev.clientX, clientY: ev.clientY })
        }

        const finish = (ev?: Event) => {
            // try to use last known coords if it's a PointerEvent
            const pe = ev as PointerEvent | undefined
            EventBus.emit("ui-drag-end", {
                clientX: pe?.clientX ?? e.clientX,
                clientY: pe?.clientY ?? e.clientY,
            })
            ctrl.abort() // removes all listeners bound with this signal
            setDragging(false)
        }

        window.addEventListener("pointermove", onMove, { signal, passive: true })
        window.addEventListener("pointerup", finish, { signal })
        window.addEventListener("pointercancel", finish, { signal })
        window.addEventListener("blur", finish, { signal })
        document.addEventListener(
            "visibilitychange",
            () => {
                if (document.hidden) finish()
            },
            { signal }
        )
    }

    return { startDrag, dragging }
}

export const BenchItem: React.FC<BenchItemProps> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    const character = props.character
    const team = props.game.playerTeam
    const levelColor = useMemo(() => (character ? convertColorToString(colorFromLevel(character.level)) : ""), [character?.level])

    const summon = () => {
        if (!character) return
        team.bench.summon(character.id)
    }

    const { startDrag, dragging } = usePhaserDragBridge()
    const onPointerDown = (e: React.PointerEvent) => (character ? startDrag(character, e) : undefined)

    return (
        <Box sx={{ flexDirection: "column", flex: 1, pointerEvents: !character ? "none" : undefined }}>
            <Button
                sx={{
                    width: 1,
                    padding: 1,
                    filter: !character || dragging ? "grayscale(100%)" : undefined,
                    overflowX: "auto",
                }}
                onClick={isMobile ? summon : undefined}
                disabled={!character}
                onPointerDown={onPointerDown}
                draggable
            >
                <Badge
                    badgeContent={character ? `${character.level}` : ""}
                    slotProps={{
                        badge: {
                            sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold", fontSize: isMobile ? 8 : undefined },
                        },
                    }}
                >
                    <CharacterAvatar name={character?.name || ""} size={35} />
                </Badge>
            </Button>
            {/* <Button
                color="warning"
                onClick={() => team.bench.sell(character?.id || "")}
                size="small"
                sx={{ minWidth: 0, visibility: !character ? "hidden" : undefined }}
            >
                <GoldCoin quantity={team.store.getCost(character?.level || 0)} fontSize={10} size={10} />
            </Button> */}
        </Box>
    )
}
