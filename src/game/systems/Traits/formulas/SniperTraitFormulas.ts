export type GridCell = {
    col: number
    row: number
}

export function calculateSniperGridDistance(attacker: GridCell, target: GridCell): number {
    return Math.max(Math.abs(attacker.col - target.col), Math.abs(attacker.row - target.row))
}

export function calculateSniperDamageMultiplier(gridDistance: number, damageMultiplierPerGrid: number): number {
    return Math.max(0, gridDistance) * Math.max(0, damageMultiplierPerGrid)
}
