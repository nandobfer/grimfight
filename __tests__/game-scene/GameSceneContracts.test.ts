import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const sceneDir = join(root, "src/game/scenes")

const contracts = [
    {
        name: "Game Scene",
        sourcePath: join(sceneDir, "Game.ts"),
        contextPath: join(root, "aicontext/game-scene.md"),
        headings: ["### State And Round Lifecycle", "### Floor Progression And Encounters", "### UI Drag Bridge", "### Persistence", "### Cleanup"],
    },
]

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("Game Scene aicontext", () => {
    it.each(contracts)("documents $name without numeric balance values", (contract) => {
        const context = readSource(contract.contextPath)

        for (const heading of contract.headings) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Game Scene contracts", () => {
    it("handles round deferral and combat transitions safely", () => {
        const source = readSource(join(sceneDir, "Game.ts"))

        expect(source).toContain("startRound()")
        expect(source).toContain("this.changeState(\"fighting\")")
        expect(source).toContain("endRoundSoon()")
        expect(source).toContain("this.changeState(\"idle\")")
        expect(source).toContain("this.time.delayedCall(0,")
        expect(source).toContain("this.finishRoundNow()")
    })

    it("manages floor progression and augment triggers", () => {
        const source = readSource(join(sceneDir, "Game.ts"))

        expect(source).toContain("onFloorDefeated()")
        expect(source).toContain("this.floor += 1")
        expect(source).toContain("buildFloor()")
        expect(source).toContain("generateEncounter(this, this.floor)")
        expect(source).toContain("handleAugmentsFloor()")
        expect(source).toContain("handleArtifactsFloor()")
        expect(source).toContain("handleEnemiesAugments()")
    })

    it("cleans up persistent listeners on scene shutdown", () => {
        const source = readSource(join(sceneDir, "Game.ts"))

        expect(source).toContain("this.events.once(Phaser.Scenes.Events.SHUTDOWN")
        expect(source).toContain("EventBus.off(\"get-progress\"")
        expect(source).toContain("EventBus.off(\"ui-drag-start\"")
        expect(source).toContain("EventBus.off(\"bench-drop\"")
    })

    it("saves and loads game state via localStorage", () => {
        const source = readSource(join(sceneDir, "Game.ts"))

        expect(source).toContain("saveProgress()")
        expect(source).toContain("localStorage.setItem(\"progress\"")
        expect(source).toContain("loadProgress()")
        expect(source).toContain("localStorage.getItem(\"progress\"")
        expect(source).toContain("saveRecord()")
        expect(source).toContain("localStorage.setItem(\"gamerecords\"")
    })
})
