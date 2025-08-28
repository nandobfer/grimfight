import { ChipPropsColorOverrides } from "@mui/material"
import { OverridableStringUnion } from "@mui/types"

export enum RarityColors {
    common = 0xcccccc,
    uncommon = 0x4caf50,
    rare = 0x2196f3,
    epic = 0x9c27b0,
    legendary = 0xff9800,
}

export const colorFromLevel = (level: number) => {
    const colors = [RarityColors.common, RarityColors.uncommon, RarityColors.rare, RarityColors.epic, RarityColors.legendary]
    const index = (((level - 1) % colors.length) + colors.length) % colors.length
    const phaserColor = colors[index]
    return phaserColor
}

export const convertColorToString = (color: number) => `#${color.toString(16).padStart(6, "0")}`

export type MuiColor = OverridableStringUnion<"default" | "primary" | "secondary" | "error" | "info" | "success" | "warning", ChipPropsColorOverrides>

/**
 * Maps MUI Chip color names to Phaser tint numbers (0xrrggbb).
 * Uses your custom dark theme overrides:
 *   primary:  #ff6404
 *   secondary:#ebebd3
 * And MUI defaults for the rest.
 */
export const convertMuiColorToPhaser = (color: MuiColor): number => {
    const map: Record<string, number> = {
        default: 0x9e9e9e, // grey[500]
        primary: 0xff6404, // your override
        secondary: 0xebebd3, // your override
        error: 0xf44336, // red[500]
        warning: 0xff9800, // orange[500]
        info: 0x2196f3, // blue[500]
        success: 0x4caf50, // green[500]
    }
    return map[color] ?? map.default
}
