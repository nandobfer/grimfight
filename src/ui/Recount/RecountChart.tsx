import React, { memo, useMemo } from "react"
import { Box } from "@mui/material"
import type { SxProps, Theme } from "@mui/material/styles"

interface TftDamageBarProps {
    physical: number
    magical: number
    trueDmg: number
    highest: number // max total across all rows
    total?: number // optional; defaults to sum of segments
    sx?: SxProps<Theme>
    colors?: { physical?: string; magical?: string; trueDmg?: string }
}

export const TftDamageBar = memo((props: TftDamageBarProps) => {
    const { physical, magical, trueDmg, highest, colors, sx } = props
    const sum = useMemo(() => physical + magical + trueDmg, [physical, magical, trueDmg])
    const total = props.total ?? sum
    const widthPct = highest > 0 ? (100 * total) / highest : 0

    const segs = useMemo(
        () =>
            (
                [
                    { key: "physical", value: physical },
                    { key: "magical", value: magical },
                    { key: "trueDmg", value: trueDmg },
                ] as const
            ).filter((s) => s.value > 0),
        [physical, magical, trueDmg]
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
                                : colors?.trueDmg ?? t.palette.secondary.main,
                        ...(i === 0 && { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }),
                        ...(i === segs.length - 1 && { borderTopRightRadius: 999, borderBottomRightRadius: 999 }),
                    })}
                />
            ))}
            {segs.length === 0 && <Box sx={{ flex: 1, bgcolor: "action.hover" }} />}
        </Box>
    )
})
