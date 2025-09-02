import React, { useMemo } from "react"
import { Badge, Box, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { DamageMeter } from "../../game/tools/DamageChart"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { TftDamageBar } from "./RecountChart"

interface MeterComponentProps {
    meter: DamageMeter
    highest_damage: number
}

export const MeterComponent: React.FC<MeterComponentProps> = ({ meter, highest_damage }) => {
    const theme = useTheme()
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(meter.character.level)), [meter.character.level])

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: 1 }}>
            <Badge
                variant="dot"
                badgeContent={``}
                slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
            >
                <CharacterAvatar name={meter.character.name} size={20} />
            </Badge>

            <Box sx={{ flex: 1 }}>
                <TftDamageBar
                    physical={meter.physical}
                    magical={meter.magical}
                    trueDmg={meter.true}
                    highest={highest_damage}
                    total={meter.total} // optional; keeps scaling consistent with your total
                    // colors={{ physical: theme.palette.error.main, magical: theme.palette.info.main, trueDmg: theme.palette.secondary.main }}
                />
            </Box>

            <Typography variant="caption" fontSize={10} sx={{ textAlign: "right" }}>
                {Math.round(meter.total)}
            </Typography>
        </Box>
    )
}
