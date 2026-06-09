import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

type MonsterContract = {
    file: string
    className: string
    baseClass: "Monster" | "Skeleton"
    registryName: string
    docHeading?: string
    superCall?: string
}

const monstersDir = join(process.cwd(), "src/game/creature/monsters")
const monsterRegistryPath = join(monstersDir, "MonsterRegistry.ts")
const monsterContextPath = join(process.cwd(), "aicontext/game-monsters.md")
const enemyTeamPath = join(monstersDir, "EnemyTeam.ts")
const monsterBasePath = join(monstersDir, "Monster.ts")
const ragnarokMonsterPath = join(monstersDir, "RagnarokMonster.ts")
const encounterPath = join(process.cwd(), "src/game/tools/Encounter.ts")
const challengeRatingPath = join(process.cwd(), "src/game/tools/ChallengeRating.ts")

const monsterContracts: MonsterContract[] = [
    { file: "Skeleton.ts", className: "Skeleton", baseClass: "Monster", registryName: "skeleton", superCall: "super(scene, texture || \"skeleton\")" },
    { file: "Zombie.ts", className: "Zombie", baseClass: "Monster", registryName: "zombie" },
    { file: "Demonic.ts", className: "Demonic", baseClass: "Monster", registryName: "demonic" },
    { file: "ArmoredSkeleton.ts", className: "ArmoredSkeleton", baseClass: "Skeleton", registryName: "armored_skeleton" },
    { file: "SkeletonArcher.ts", className: "SkeletonArcher", baseClass: "Skeleton", registryName: "skeleton_archer" },
    { file: "SkeletonAssassin.ts", className: "SkeletonAssassin", baseClass: "Skeleton", registryName: "skeleton_assassin" },
    { file: "SkeletonNecromancer.ts", className: "SkeletonNecromancer", baseClass: "Skeleton", registryName: "skeleton_necromancer" },
    { file: "SkeletonDrainer.ts", className: "SkeletonDrainer", baseClass: "Skeleton", registryName: "skeleton_drainer" },
    { file: "SkeletonPyromancer.ts", className: "SkeletonPyromancer", baseClass: "Skeleton", registryName: "skeleton_pyromancer" },
    { file: "SkeletonCryomancer.ts", className: "SkeletonCryomancer", baseClass: "Skeleton", registryName: "skeleton_cryomancer" },
]

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

function readMonsterSource(file: string) {
    return readSource(join(monstersDir, file))
}

describe("monster class contracts", () => {
    it.each(monsterContracts)("$className extends the expected monster base and uses its registry key", (contract) => {
        const source = readMonsterSource(contract.file)

        expect(source).toMatch(new RegExp(`export class ${contract.className} extends ${contract.baseClass}`))
        expect(source).toContain(contract.superCall ?? `super(scene, "${contract.registryName}")`)
        expect(source).toContain("this.challengeRating = this.calculateCR()")
    })

    it.each(monsterContracts)("$className is registered in MonsterRegistry", (contract) => {
        const registrySource = readSource(monsterRegistryPath)

        expect(registrySource).toContain(`MonsterRegistry.register("${contract.registryName}", ${contract.className})`)
    })

    it.each(monsterContracts)("$className is documented in game-monsters aicontext", (contract) => {
        const context = readSource(monsterContextPath)
        const heading = contract.docHeading ?? contract.className

        expect(context).toContain(`### ${heading}`)
    })
})

describe("monster system contracts", () => {
    it("documents monster systems without numeric balance contracts", () => {
        const context = readSource(monsterContextPath)

        expect(context).toContain("### Monster")
        expect(context).toContain("### RagnarokMonster")
        expect(context).toContain("### EnemyTeam")
        expect(context).toContain("### MonsterRegistry")
        expect(context).toContain("### Encounters")
        expect(context).toContain("### Challenge Rating")
        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })

    it("Monster cleans FX and item visuals through its lifecycle hooks", () => {
        const source = readSource(monsterBasePath)

        expect(source).toContain("calculateCR(): number")
        expect(source).toContain("scaleStats(mult: number)")
        expect(source).toContain("makeBoss(targetCR: number)")
        expect(source).toContain("clearFX()")
        expect(source).toContain("override equipItem")
        expect(source).toContain("item.removeDragHandlers()")
        expect(source).toContain("item.snapToCreature(this)")
        expect(source).toContain("override unequipItem")
        expect(source).toContain("item.sprite.destroy(true)")
        expect(source).toContain("override destroy")
        expect(source).toContain("this.clearFX()")
        expect(source).toContain("this.applyAugments()")
    })

    it("RagnarokMonster adapts animation extraction and facing direction", () => {
        const source = readSource(ragnarokMonsterPath)

        expect(source).toContain("export class RagnarokMonster extends Monster")
        expect(source).toContain("override extractAnimationsFromSpritesheet")
        expect(source).toContain("this.anims.create")
        expect(source).toContain("updateFacingDirection")
        expect(source).toContain("this.setFlipX")
    })

    it("EnemyTeam resets positioning, augments, and item snapping", () => {
        const source = readSource(enemyTeamPath)

        expect(source).toContain("override getChildren")
        expect(source).toContain("reset()")
        expect(source).toContain("this.replaceInBoard()")
        expect(source).toContain("this.snapItems()")
        expect(source).toContain("preferredPosition")
        expect(source).toContain("override addAugment")
        expect(source).toContain("augment.onPick(this)")
        expect(source).toContain("EventBus.emit(\"enemies-augments-add\"")
        expect(source).toContain("emitAugments()")
        expect(source).toContain("item.snapToCreature(monster)")
    })

    it("MonsterRegistry exposes creation, listing, entries, and copied base stats", () => {
        const source = readSource(monsterRegistryPath)

        expect(source).toContain("private static registry")
        expect(source).toContain("private static normalRegistry")
        expect(source).toContain("static register")
        expect(source).toContain("static create")
        expect(source).toContain("throw new Error(`Monster not found: ${name}`)")
        expect(source).toContain("static names")
        expect(source).toContain("static normalMonstersNames")
        expect(source).toContain("static entries")
        expect(source).toContain("static getBaseStats")
        expect(source).toContain("return { ...CR_1_MONSTER[id] }")
    })

    it("Encounter generation uses registry entries, CR cache invalidation, boss flow, and CR itemization", () => {
        const source = readSource(encounterPath)

        expect(source).toContain("MonsterRegistry.entries()")
        expect(source).toContain("CR_CACHE")
        expect(source).toContain("invalidateEncounterCRCache")
        expect(source).toContain("generateEncounter")
        expect(source).toContain("boss.makeBoss(targetCR)")
        expect(source).toContain("equipMonsterWithCRItems")
        expect(source).toContain("monster.equipItem(item, true)")
    })

    it("ChallengeRating exposes cache invalidation and computes bounded CR values", () => {
        const source = readSource(challengeRatingPath)

        expect(source).toContain("export function invalidateCR")
        expect(source).toContain("function expectedPerHit")
        expect(source).toContain("function rawCR")
        expect(source).toContain("function buildParams")
        expect(source).toContain("MonsterRegistry.getBaseStats")
        expect(source).toContain("export function computeCR")
        expect(source).toContain("Math.max(0.1")
    })
})
