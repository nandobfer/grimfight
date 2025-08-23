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