import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { version } from "../../package.json"
import { debugMenuVersionLabel } from "../../src/ui/DebugMenu/debugMenuVersion"

const root = process.cwd()

describe("Debug menu version label", () => {
    it("derives the label from the package version instead of a hardcoded value", () => {
        expect(debugMenuVersionLabel).toContain(version)
    })

    it("keeps a readable label that still exposes the raw version", () => {
        expect(debugMenuVersionLabel).toMatch(/^Versão: \d+\.\d+\.\d+$/)
    })

    it("keeps package.json on a valid semantic version", () => {
        expect(version).toMatch(/^\d+\.\d+\.\d+$/)
    })
})

describe("Debug menu wiring", () => {
    it("renders the shared version label inside the debug menu panel", () => {
        const source = readFileSync(join(root, "src/ui/DebugMenu/DebugMenu.tsx"), "utf8")

        expect(source).toContain("debugMenuVersionLabel")
        expect(source).toContain("{debugMenuVersionLabel}")
    })
})
