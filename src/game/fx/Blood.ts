import { Game } from "../scenes/Game"

export const burstBlood = (scene: Game, x: number, y: number) => {
    const particles = scene.add.particles(x, y, "blood", {
        lifespan: 600,
        speed: { min: 30, max: 80 },
        scale: { start: 0.15, end: 0 },
        quantity: 5,
        blendMode: "NORMAL",
        frequency: -1,
    })

    particles.explode(10)

    scene.time.delayedCall(600, () => {
        particles.destroy()
    })
    return particles
}
