import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

type CharacterContract = {
    file: string
    className: string
    registryClassName?: string
    registryName: string
    docHeading?: string
}

const classesDir = join(process.cwd(), "src/game/creature/classes")
const characterRegistryPath = join(process.cwd(), "src/game/creature/CharacterRegistry.ts")
const gameCreaturesContextPath = join(process.cwd(), "aicontext/game-creatures.md")

const helperFiles = new Set(["FandralFlameSlash.ts", "RokmoraConstellations.ts", "YueFireRay.ts"])

const characterContracts: CharacterContract[] = [
    { file: "Archer.ts", className: "Archer", registryName: "laherce" },
    { file: "Arthas.ts", className: "Arthas", registryName: "arthas" },
    { file: "Banguela.ts", className: "Banguela", registryName: "banguela" },
    { file: "Barbarian.ts", className: "Barbarian", registryName: "grok" },
    { file: "Chichi.ts", className: "Chichi", registryName: "chichi" },
    { file: "Dracula.ts", className: "Dracula", registryName: "dracula" },
    { file: "Druid.ts", className: "Helyna", registryName: "helyna", docHeading: "Helyna" },
    { file: "Fandral.ts", className: "Fandral", registryName: "fandral" },
    { file: "Frank.ts", className: "Frank", registryName: "frank" },
    { file: "Freud.ts", className: "Freud", registryName: "freud" },
    { file: "Jacrost.ts", className: "Jacrost", registryName: "jacrost" },
    { file: "Lalatina.ts", className: "Lalatina", registryName: "lalatina" },
    { file: "Lizwan.ts", className: "Lizwan", registryName: "lizwan" },
    { file: "Mage.ts", className: "Mage", registryName: "megumin" },
    { file: "Melisandre.ts", className: "Melisandre", registryName: "melisandre" },
    { file: "Maximus.ts", className: "Knight", registryName: "maximus", docHeading: "Knight" },
    { file: "Melo.ts", className: "Melo", registryName: "melo" },
    { file: "Mordred.ts", className: "Rogue", registryName: "mordred", docHeading: "Rogue" },
    { file: "Necromancer.ts", className: "Necromancer", registryName: "zairon" },
    { file: "Reno.ts", className: "Reno", registryName: "reno" },
    { file: "Rokmora.ts", className: "Rokmora", registryName: "rokmora" },
    { file: "Rukia.ts", className: "Rukia", registryName: "rukia" },
    { file: "Sorcerer.ts", className: "Sorcerer", registryName: "jadis" },
    { file: "Statikk.ts", className: "Statikk", registryName: "statikk" },
    { file: "Vania.ts", className: "Vania", registryName: "vania" },
    { file: "Ymir.ts", className: "Ymir", registryName: "ymir" },
    { file: "Yue.ts", className: "Yue", registryName: "yue" },
]

function readClassSource(file: string) {
    return readFileSync(join(classesDir, file), "utf8")
}

describe("playable character class contracts", () => {
    it("tracks every concrete playable character class file", () => {
        const concreteClassFiles = readdirSync(classesDir)
            .filter((file) => file.endsWith(".ts") && !helperFiles.has(file))
            .sort()

        expect(characterContracts.map((contract) => contract.file).sort()).toEqual(concreteClassFiles)
    })

    it.each(characterContracts)("$className extends Character, names its ability, and calls Character with its registry key", (contract) => {
        const source = readClassSource(contract.file)

        expect(source).toMatch(new RegExp(`export class ${contract.className} extends Character`))
        expect(source).toMatch(/abilityName\??\s*(?::[^=]+)?=/)
        expect(source).toContain(`super(scene, "${contract.registryName}", id)`)
    })

    it.each(characterContracts)("$className is registered in CharacterRegistry", (contract) => {
        const registrySource = readFileSync(characterRegistryPath, "utf8")
        const registryClassName = contract.registryClassName ?? contract.className

        expect(registrySource).toMatch(new RegExp(`CharacterRegistry\\.register\\("${contract.registryName}",\\s*${registryClassName}(?:,|\\))`))
    })
})

describe("playable character aicontext", () => {
    it.each(characterContracts)("documents $className without relying on balance numbers", (contract) => {
        const context = readFileSync(gameCreaturesContextPath, "utf8")
        const heading = contract.docHeading ?? contract.className

        expect(context).toContain(`### ${heading}`)
    })

    it("keeps game creature context free of numeric balance contracts", () => {
        const context = readFileSync(gameCreaturesContextPath, "utf8")

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("playable character pure behavior", () => {
    it("keeps non-Phaser helper behavior colocated with the owning character classes", () => {
        const renoSource = readClassSource("Reno.ts")
        const necromancerSource = readClassSource("Necromancer.ts")
        const druidSource = readClassSource("Druid.ts")
        const frankSource = readClassSource("Frank.ts")

        expect(renoSource).toContain("scaleAdFromAs()")
        expect(renoSource).toContain("getAsMultiplier()")
        expect(necromancerSource).toContain("createLinearMapping")
        expect(druidSource).toContain("getAnimationTextureName")
        expect(frankSource).toContain("drainLife(target")
    })

    it.each(["Frank.ts", "Freud.ts", "Lizwan.ts", "Reno.ts"])("keeps passive no-mana character %s mana locked after stat refresh", (file) => {
        const source = readClassSource(file)

        expect(source).toMatch(/override refreshStats\(\): void \{[\s\S]*super\.refreshStats\(\)[\s\S]*this\.manaLocked = true[\s\S]*\}/)
    })

    it("gives Lalatina starting mana through gainMana after refresh", () => {
        const source = readClassSource("Lalatina.ts")

        expect(source).toContain("this.gainMana(this.maxMana * 0.65)")
        expect(source).not.toContain("this.mana *= this.maxMana * 0.65")
    })

    it("gives Melisandre starting mana through gainMana after refresh", () => {
        const source = readClassSource("Melisandre.ts")

        expect(source).toContain("this.gainMana(this.maxMana * 0.5)")
        expect(source).not.toContain("this.mana *= this.maxMana * 0.5")
    })

    it("keeps Yue cast-triggered traits aligned with the randomly picked fire ray target", () => {
        const source = readClassSource("Yue.ts")

        expect(source).toMatch(/const target = this\.pickFireRayTarget\(\)[\s\S]*this\.target = target[\s\S]*this\.drawFireRay\(target/)
    })

    it("passes Silver Bolt's actual victim through Vania's on-hit flow", () => {
        const source = readClassSource("Vania.ts")

        expect(source).toMatch(/arrow\.onHit = \(target\) => \{[\s\S]*target\.takeDamage\([\s\S]*this\.onHit\(target\)[\s\S]*arrow\.destroy\(\)/)
    })

    it("keeps Fandral pounce casts from reentering or refund-looping without a valid target", () => {
        const source = readClassSource("Fandral.ts")

        expect(source).toContain("override castAbility(multiplier = 1): boolean")
        expect(source).toContain("if (this.casting) return false")
        expect(source).toMatch(/const target = this\.getValidFlameSlashTarget\(\)[\s\S]*if \(!target\) \{[\s\S]*this\.target = undefined[\s\S]*return false[\s\S]*\}/)
        expect(source).toContain("private failFlameSlashCast()")
        expect(source).not.toContain("this.gainMana(this.maxMana)")
    })
})
