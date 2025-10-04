import React, { useMemo } from "react"
import { Badge, Box, MenuItem, Tooltip, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { DamageMeter, HealingMeter } from "../../game/tools/DamageChart"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { TftDamageBar } from "./RecountChart"
import { DetailedChart } from "./DetailedChart"

interface MeterComponentProps {
    meter: DamageMeter | HealingMeter
    highest_damage: number
}

export const MeterComponent: React.FC<MeterComponentProps> = ({ meter, highest_damage }) => {
    const theme = useTheme()
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(meter.character.level)), [meter.character.level])

    return (
        <Tooltip title={<DetailedChart meter={meter} highest_damage={highest_damage} levelColor={levelColor} />} placement="right" arrow>
            <MenuItem sx={{ display: "flex", gap: 1, alignItems: "center", width: 1, whiteSpace: "normal", px: 1 }}>
                <Badge
                    variant="dot"
                    badgeContent={``}
                    slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
                >
                    <CharacterAvatar name={meter.character.name} size={20} />
                </Badge>

                <Box sx={{ flex: 1 }}>
                    <TftDamageBar
                        physical={"physical" in meter ? meter.physical : 0}
                        magical={"magical" in meter ? meter.magical : 0}
                        trueDmg={"true" in meter ? meter.true : 0}
                        healed={"healed" in meter ? meter.healed : 0}
                        shielded={"shielded" in meter ? meter.shielded : 0}
                        highest={highest_damage}
                        total={meter.total} // optional; keeps scaling consistent with your total
                        // colors={{ physical: theme.palette.error.main, magical: theme.palette.info.main, trueDmg: theme.palette.secondary.main }}
                    />
                </Box>

                <Typography variant="caption" fontSize={10} sx={{ textAlign: "right" }}>
                    {Math.round(meter.total)}
                </Typography>
            </MenuItem>
        </Tooltip>
    )
}
