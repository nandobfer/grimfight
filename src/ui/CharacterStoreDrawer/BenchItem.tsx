import React, { useEffect, useMemo, useRef, useState } from "react"
import { Badge, Box, Button, useMediaQuery } from "@mui/material"
import { CharacterDto } from "../../game/creature/character/Character"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { Game } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"

interface BenchItemProps {
    character?: CharacterDto
    game: Game
}

export function usePhaserDragBridge() {
    const ctrlRef = useRef<AbortController | null>(null)
    const [dragging, setDragging] = useState(false)

    useEffect(() => () => ctrlRef.current?.abort(), [])

    const startFromPoint = (dto: CharacterDto, clientX: number, clientY: number) => {
        setDragging(true)
        EventBus.emit("ui-drag-start", { dto, clientX, clientY })

        const ctrl = new AbortController()
        ctrlRef.current = ctrl
        const { signal } = ctrl

        const onPointerMove = (ev: PointerEvent) => {
            EventBus.emit("ui-drag-move", { clientX: ev.clientX, clientY: ev.clientY })
        }
        const onPointerUp = (ev: PointerEvent) => finish(ev.clientX, ev.clientY)

        // IMPORTANT: non-passive touchmove so we can prevent scroll
        const onTouchMove = (ev: TouchEvent) => {
            if (!ev.touches.length) return
            ev.preventDefault()
            const t = ev.touches[0]
            EventBus.emit("ui-drag-move", { clientX: t.clientX, clientY: t.clientY })
        }
        const onTouchEnd = (ev: TouchEvent) => {
            const t = ev.changedTouches[0]
            finish(t.clientX, t.clientY)
        }

        const finish = (cx: number, cy: number) => {
            EventBus.emit("ui-drag-end", { clientX: cx, clientY: cy })
            ctrl.abort()
            setDragging(false)
        }

        // attach both streams; only one will fire on a given device
        window.addEventListener("pointermove", onPointerMove, { signal, passive: true })
        window.addEventListener("pointerup", onPointerUp, { signal })
        window.addEventListener("pointercancel", onPointerUp, { signal })
        window.addEventListener("touchmove", onTouchMove, { signal, passive: false })
        window.addEventListener("touchend", onTouchEnd, { signal })
        window.addEventListener("touchcancel", onTouchEnd, { signal })
        window.addEventListener("blur", () => finish(clientX, clientY), { signal })
    }

    const startDrag = (dto: CharacterDto, e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        startFromPoint(dto, e.clientX, e.clientY)
    }

    const startDragTouch = (dto: CharacterDto, e: React.TouchEvent) => {
        const t = e.touches[0]
        e.preventDefault()
        e.stopPropagation()
        startFromPoint(dto, t.clientX, t.clientY)
    }

    return { startDrag, startDragTouch, dragging }
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

    const { startDrag, dragging, startDragTouch } = usePhaserDragBridge()
    const onPointerDown = (e: React.PointerEvent) => (character ? startDrag(character, e) : undefined)

    return (
        <Box sx={{ flexDirection: "column", flex: 1, pointerEvents: !character ? "none" : undefined }}>
            <Button
                sx={{
                    touchAction: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    width: 1,
                    padding: 1,
                    filter: !character || dragging ? "grayscale(100%)" : undefined,
                    overflowX: "auto",
                }}
                onClick={isMobile ? summon : undefined}
                disabled={!character}
                onPointerDown={(e) => character && startDrag(character, e)}
                onTouchStart={(e) => character && startDragTouch(character, e)}
                // HTML5 DnD off (breaks mobile)
                draggable={false}
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
