import { useEffect, useRef, useState } from "react"
import { CharacterDto } from "../../game/creature/character/Character"
import { EventBus } from "../../game/tools/EventBus"

export const useCharacterBridge = () => {
    const [preview, setPreview] = useState<CharacterDto | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const hoveringRef = useRef(false)
    const lastDtoRef = useRef<CharacterDto | null>(null)

    useEffect(() => {
        const inside = (x: number, y: number) => {
            const el = wrapperRef.current
            if (!el) return false
            const r = el.getBoundingClientRect()
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
        }

        const onStart = ({ dto, clientX, clientY }: { dto: CharacterDto; clientX: number; clientY: number }) => {
            lastDtoRef.current = dto
            if (inside(clientX, clientY)) {
                hoveringRef.current = true
                setPreview(dto)
                EventBus.emit("bench-hover-enter", { id: dto.id })
            }
        }

        const onMove = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
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
    }, [])

    return { preview, wrapperRef }
}
