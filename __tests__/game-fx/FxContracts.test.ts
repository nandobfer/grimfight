import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const fxDir = join(root, "src/game/fx")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("FX combat contracts", () => {
    it("Explosion excludes the primary target from secondary area damage", () => {
        const source = readSource(join(fxDir, "Explosion.ts"))

        expect(source.match(/if \(enemy === this\.target\) return/g)).toHaveLength(2)
        expect(source).toContain("enemy.takeDamage")
    })
})
