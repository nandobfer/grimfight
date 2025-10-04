import React, { memo, useMemo } from "react"
import { Box } from "@mui/material"
import type { SxProps, Theme } from "@mui/material/styles"

interface TftDamageBarProps {
    physical?: number
    magical?: number
    trueDmg?: number
    healed?: number
    shielded?: number
    highest: number // max total across all rows
    total?: number // optional; defaults to sum of segments
    sx?: SxProps<Theme>
    colors?: { physical?: string; magical?: string; trueDmg?: string }
}

export const TftDamageBar = memo((props: TftDamageBarProps) => {
    const { physical = 0, magical = 0, trueDmg = 0, healed = 0, shielded = 0, highest, colors, sx } = props
    const sum = useMemo(() => physical + magical + trueDmg + healed + shielded, [physical, magical, trueDmg, healed, shielded])
    const total = props.total ?? sum
    const widthPct = highest > 0 ? (100 * total) / highest : 0

    const segs = useMemo(
        () =>
            (
                [
                    { key: "physical", value: physical },
                    { key: "magical", value: magical },
                    { key: "trueDmg", value: trueDmg },
                    { key: "healed", value: healed },
                    { key: "shielded", value: shielded },
                ] as const
            ).filter((s) => (s.value ?? 0) > 0),
        [physical, magical, trueDmg, healed, shielded]
    )

    return (
        <Box
            sx={{
                width: `${Math.max(0, Math.min(100, widthPct)).toFixed(4)}%`,
                height: 5,
                borderRadius: 0.1,
                overflow: "hidden",
                display: "flex",
                transition: "width 180ms ease",
                outline: (t) => `1px solid ${t.palette.action.disabledBackground}`, // keeps white visible
                ...sx,
            }}
        >
            {segs.map((s, i) => (
                <Box
                    key={s.key}
                    sx={(t) => ({
                        flexGrow: s.value, // proportional segment width
                        height: "100%",
                        bgcolor:
                            s.key === "physical"
                                ? colors?.physical ?? t.palette.error.main
                                : s.key === "magical"
                                ? colors?.magical ?? t.palette.info.main
                                : s.key === "trueDmg"
                                ? colors?.trueDmg ?? t.palette.secondary.main
                                : s.key === "healed"
                                ? t.palette.success.main
                                : t.palette.secondary.main, // shielded
                        ...(i === 0 && { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }),
                        ...(i === segs.length - 1 && { borderTopRightRadius: 999, borderBottomRightRadius: 999 }),
                    })}
                />
            ))}
            {segs.length === 0 && <Box sx={{ flex: 1, bgcolor: "action.hover" }} />}
        </Box>
    )
})
