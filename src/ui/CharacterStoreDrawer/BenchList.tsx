import React, { useEffect, useMemo, useRef, useState } from "react"
import { Box } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { CharacterDto } from "../../game/creature/character/Character"
import { EventBus } from "../../game/tools/EventBus"
import { BenchItem } from "./BenchItem"

interface BenchListProps {
    game: Game
}

export const BenchList: React.FC<BenchListProps> = (props) => {
    const [characters, setCharacters] = useState<CharacterDto[]>(props.game.playerTeam.bench.characters)
    const availableSlots = useMemo(() => props.game.max_bench_size - characters.length, [characters.length])

    const [preview, setPreview] = useState<CharacterDto | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const hoveringRef = useRef(false)
    const lastDtoRef = useRef<CharacterDto | null>(null)

    useEffect(() => {
        const handler = (items: CharacterDto[]) => {
            console.log(items)
            setCharacters([...items])
        }

        EventBus.on("character-bench", handler)

        return () => {
            EventBus.off("character-bench", handler)
        }
    }, [])

    useEffect(() => {
        const inside = (x: number, y: number) => {
            if (availableSlots < 1) {
                return
            }
            const el = wrapperRef.current
            if (!el) return false
            const r = el.getBoundingClientRect()
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
        }

        const onStart = ({ dto, clientX, clientY }: { dto: CharacterDto; clientX: number; clientY: number }) => {
            if (availableSlots < 1) {
                return
            }
            lastDtoRef.current = dto
            if (inside(clientX, clientY)) {
                hoveringRef.current = true
                setPreview(dto)
                EventBus.emit("bench-hover-enter", { id: dto.id })
            }
        }

        const onMove = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
            if (availableSlots < 1) {
                return
            }
            const dto = lastDtoRef.current
            if (!dto) return
            const isIn = inside(clientX, clientY)
            if (isIn && !hoveringRef.current) {
                hoveringRef.current = true
                setPreview(dto)
                EventBus.emit("bench-hover-enter", { id: dto.id })
            } else if (!isIn && hoveringRef.current) {
                hoveringRef.current = false
                setPreview(null)
                EventBus.emit("bench-hover-leave", { id: dto.id })
            }
        }

        const onEnd = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
            if (availableSlots < 1) {
                return
            }
            const dto = lastDtoRef.current
            if (!dto) return
            const isIn = inside(clientX, clientY)
            if (isIn) {
                // commit
                EventBus.emit("bench-drop", { id: dto.id, dto })
            } else {
                // cancel
                EventBus.emit("bench-cancel", { id: dto.id })
            }
            setPreview(null)
            hoveringRef.current = false
            lastDtoRef.current = null
        }

        EventBus.on("ph-drag-start", onStart)
        EventBus.on("ph-drag-move", onMove)
        EventBus.on("ph-drag-end", onEnd)
        return () => {
            EventBus.off("ph-drag-start", onStart)
            EventBus.off("ph-drag-move", onMove)
            EventBus.off("ph-drag-end", onEnd)
        }
    }, [availableSlots])

    return (
        <Box ref={wrapperRef} sx={{ position: "relative" }}>
            {characters.map((dto) => (
                <BenchItem key={dto.id} character={dto} game={props.game} />
            ))}
            {preview && (
                <Box sx={{ opacity: 0.6 }}>
                    <BenchItem character={preview} game={props.game} />
                </Box>
            )}
            {new Array(preview && availableSlots > 0 ? availableSlots - 1 : availableSlots).fill(null).map((_, index) => (
                <BenchItem key={index} game={props.game} />
            ))}
        </Box>
    )
}
