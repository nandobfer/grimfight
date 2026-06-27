export function calculateRemainingDotDamage(params: {
    duration: number
    totalTimePassed: number
    tickDamage: number
    tickRate: number
}): number {
    if (params.tickRate <= 0 || params.tickDamage <= 0 || params.duration <= 0) return 0

    const remainingDuration = Math.max(0, params.duration - params.totalTimePassed)
    return (remainingDuration / params.tickRate) * params.tickDamage
}
