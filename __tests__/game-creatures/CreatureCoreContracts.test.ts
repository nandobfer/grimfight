import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const creaturePath = join(process.cwd(), "src/game/creature/Creature.ts")
const contextPath = join(process.cwd(), "aicontext/game-creature-core.md")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

function creatureSource() {
    return readSource(creaturePath)
}

describe("Creature core aicontext", () => {
    it("documents stable Creature contracts without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of [
            "### Creature",
            "### Construction",
            "### Stats And Refresh",
            "### Modifiers",
            "### Channeling And Locks",
            "### Targeting And Movement",
            "### Facing And Animation",
            "### Combat",
            "### Damage Healing And Shield",
            "### Mana And Casting",
            "### Death And Wipe",
            "### Items",
            "### Auras And Status Effects",
            "### UI And FX",
            "### Update Loop",
        ]) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Creature construction and refresh contracts", () => {
    it("uses CreatureVisualRegistry and data-only construction to avoid Phaser setup", () => {
        const source = creatureSource()

        expect(source).toContain("CreatureVisualRegistry.get(name)")
        expect(source).toContain("visual?.textureKey ?? name")
        expect(source).toContain("visual?.initialFrame")
        expect(source).toContain("if (!dataOnly)")
        expect(source).toContain("this.scene.add.existing(this)")
        expect(source).toContain("this.scene.physics.add.existing(this)")
        expect(source).toContain("this.createAnimations()")
        expect(source).toContain("new ProgressBar")
        expect(source).toContain("this.setPipeline(\"Light2D\")")
    })

    it("reset restores combat state, clears transient state, and syncs items", () => {
        const source = creatureSource()

        expect(source).toContain("reset()")
        expect(source).toContain("this.calculateStats()")
        expect(source).toContain("this.health = this.maxHealth")
        expect(source).toContain("this.moveLocked = false")
        expect(source).toContain("this.attackLocked = false")
        expect(source).toContain("this.manaLocked = false")
        expect(source).toContain("this.frozen = false")
        expect(source).toContain("this.resetUi()")
        expect(source).toContain("this.items.forEach((item) => item.syncPosition(this))")
        expect(source).toContain("this.statusEffects.clear()")
        expect(source).toContain("this.conditionsValues.clear()")
        expect(source).toContain("this.target = undefined")
    })

    it("refreshStats prevents reentry and reapplies modifiers in a finally-safe flow", () => {
        const source = creatureSource()

        expect(source).toContain("if (this.isRefreshing) return")
        expect(source).toContain("this.isRefreshing = true")
        expect(source).toContain("this.reset()")
        expect(source).toContain("this.applyItems()")
        expect(source).toContain("this.applyAugments()")
        expect(source).toContain("this.applyAuras()")
        expect(source).toContain("finally")
        expect(source).toContain("this.isRefreshing = false")
    })

    it("calculates current stats from base stats and keeps speed calculation overridable", () => {
        const source = creatureSource()

        expect(source).toContain("calculateSpeeds()")
        expect(source).toContain("this.attackSpeed = this.baseAttackSpeed")
        expect(source).toContain("this.speed = this.baseSpeed")
        expect(source).toContain("calculateStats()")
        expect(source).toContain("this.maxHealth = this.baseMaxHealth")
        expect(source).toContain("this.attackDamage = this.baseAttackDamage")
        expect(source).toContain("this.abilityPower = this.baseAbilityPower")
        expect(source).toContain("this.maxMana = this.baseMaxMana")
        expect(source).toContain("this.shield = 0")
        expect(source).toContain("this.calculateSpeeds()")
    })
})

describe("Creature modifier contracts", () => {
    it("applies item cleanup before item modifiers", () => {
        const source = creatureSource()

        expect(source).toContain("applyItems()")
        expect(source).toContain("item.cleanup(this)")
        expect(source).toContain("item.applyModifier(this)")
    })

    it("applies auras from self, team, and master team", () => {
        const source = creatureSource()

        expect(source).toContain("this.auras?.forEach((aura) => aura.tryApply(this))")
        expect(source).toContain("this.team?.auras?.forEach((aura) => aura.tryApply(this))")
        expect(source).toContain("this.master?.team.auras?.forEach((aura) => aura.tryApply(this))")
    })

    it("uses the master team for minion augments when present", () => {
        const source = creatureSource()

        expect(source).toContain("const team = this.master?.team || this.team")
        expect(source).toContain("team?.augments?.forEach((augment) => augment.applyModifier(this))")
    })
})

describe("Creature targeting, movement, and animation contracts", () => {
    it("starts and stops channeling by toggling the same locks", () => {
        const source = creatureSource()

        expect(source).toContain("startChanneling()")
        expect(source).toContain("this.attackLocked = true")
        expect(source).toContain("this.manaLocked = true")
        expect(source).toContain("this.moveLocked = true")
        expect(source).toContain("stopChanneling()")
        expect(source).toContain("this.attackLocked = false")
        expect(source).toContain("this.manaLocked = false")
        expect(source).toContain("this.moveLocked = false")
    })

    it("selects enemy teams and targets while ignoring invalid enemies", () => {
        const source = creatureSource()

        expect(source).toContain("getEnemyTeam()")
        expect(source).toContain("this.scene.playerTeam.contains(this.master || this)")
        expect(source).toContain("findEnemyByDistance")
        expect(source).toContain("if (!enemy.active || !enemy.canBeTargeted)")
        expect(source).toContain("getClosestEnemy()")
        expect(source).toContain("getFartestEnemy()")
        expect(source).toContain("newTarget()")
        expect(source).toContain("this.target = this.getClosestEnemy()")
    })

    it("moves, teleports, dashes, and updates facing through explicit hooks", () => {
        const source = creatureSource()

        expect(source).toContain("teleportTo(x: number, y: number)")
        expect(source).toContain("this.body.reset(x, y)")
        expect(source).toContain("this.emit(\"move\", this, x, y)")
        expect(source).toContain("dashTo(x: number, y: number")
        expect(source).toContain("this.scene.tweens.add")
        expect(source).toContain("moveToTarget()")
        expect(source).toContain("if (this.moveLocked || this.frozen) return")
        expect(source).toContain("avoidOtherCharacters()")
        expect(source).toContain("updateFacingDirection()")
        expect(source).toContain("getOppositeDirection()")
    })

    it("creates animations through visual definitions or spritesheet extraction", () => {
        const source = creatureSource()

        expect(source).toContain("createAnimations()")
        expect(source).toContain("visual.createAnimations(this)")
        expect(source).toContain("extractAnimationsFromSpritesheet")
        expect(source).toContain("this.anims.create")
        expect(source).toContain("extractAttackingAnimation()")
        expect(source).toContain("getAnimationTextureName()")
    })

    it("cleans animation frame listeners after animation complete or stop", () => {
        const source = creatureSource()

        expect(source).toContain("onAnimationFrame")
        expect(source).toContain("this.on(\"animationupdate\", onUpdate)")
        expect(source).toContain("this.off(\"animationupdate\", onUpdate)")
        expect(source).toContain("this.once(\"animationcomplete\", cleanup)")
        expect(source).toContain("this.once(\"animationstop\", cleanup)")
    })
})

describe("Creature combat contracts", () => {
    it("guards attack startup and resolves impact through landAttack", () => {
        const source = creatureSource()

        expect(source).toContain("startAttack()")
        expect(source).toContain("if (this.attacking || this.casting || !this.target?.active || this.attackLocked || this.frozen)")
        expect(source).toContain("this.attacking = true")
        expect(source).toContain("() => this.landAttack()")
        expect(source).toContain("() => (this.attacking = false)")
        expect(source).toContain("landAttack()")
        expect(source).toContain("this.onAttackLand(\"normal\")")
    })

    it("calculates damage, applies attacks, emits hit flow, and handles crit events", () => {
        const source = creatureSource()

        expect(source).toContain("tryCrit")
        expect(source).toContain("calculateDamage")
        expect(source).toContain("forceCrit || this.tryCrit()")
        expect(source).toContain("onAttackLand")
        expect(source).toContain("victim.takeDamage")
        expect(source).toContain("this.onHit(victim)")
        expect(source).toContain("target?.gainMana(target.manaOnHit)")
        expect(source).toContain("this.gainMana(this.manaPerAttack)")
        expect(source).toContain("this.emit(\"afterAttack\", target)")
    })

    it("resolves damage through armor, shield, lifesteal, death, and combat events", () => {
        const source = creatureSource()

        expect(source).toContain("takeDamage")
        expect(source).toContain("type === \"true\" ? damage")
        expect(source).toContain("type = \"block\"")
        expect(source).toContain("this.shield -= absorbed")
        expect(source).toContain("this.emit(\"shield-broken\")")
        expect(source).toContain("this.health -= hpDamage")
        expect(source).toContain("this.scene.onHitFx")
        expect(source).toContain("attacker.heal")
        expect(source).toContain("this.die()")
        expect(source).toContain("attacker.emit(\"kill\", this)")
        expect(source).toContain("attacker.emit(\"dealt-damage\", this, finalDamage)")
        expect(source).toContain("this.emit(\"damage-taken\", finalDamage, attacker)")
        expect(source).toContain("attacker.emit(\"dealt-damage-crit\", this, finalDamage)")
    })

    it("heals and shields through UI, chart, and events without exposing balance constants", () => {
        const source = creatureSource()

        expect(source).toContain("gainShield(value: number")
        expect(source).toContain("this.healthBar.setShield")
        expect(source).toContain("plotHealing(plot.healer, value, \"shielded\", plot.source)")
        expect(source).toContain("this.emit(\"gain-shield\", value, plot?.healer)")
        expect(source).toContain("heal(value: number")
        expect(source).toContain("if (!this.active) return")
        expect(source).toContain("this.health = Math.min(this.maxHealth, this.health + value)")
        expect(source).toContain("plotHealing(plot.healer, healedValue, \"healed\", plot.source)")
        expect(source).toContain("this.emit(\"healed\", healedValue, plot.healer)")
    })
})

describe("Creature mana, death, item, aura, and update contracts", () => {
    it("gains and regenerates mana only when allowed, then starts casting", () => {
        const source = creatureSource()

        expect(source).toContain("gainMana(manaGained: number)")
        expect(source).toContain("if (this.manaLocked) return")
        expect(source).toContain("this.manaBar?.setValue")
        expect(source).toContain("this.startCastingAbility()")
        expect(source).toContain("regenMana(delta: number)")
        expect(source).toContain("if (this.casting) return")
        expect(source).toContain("this.gainMana(manaGained)")
        expect(source).toContain("startCastingAbility()")
        expect(source).toContain("this.castAbility()")
        expect(source).toContain("this.emit(\"cast\")")
    })

    it("handles death, revive, wipe checks, and death FX lifecycle hooks", () => {
        const source = creatureSource()

        expect(source).toContain("revive()")
        expect(source).toContain("die()")
        expect(source).toContain("this.statusEffects.clear()")
        expect(source).toContain("this.stopMoving()")
        expect(source).toContain("this.anims.stop()")
        expect(source).toContain("this.active = false")
        expect(source).toContain("this.onDieFx()")
        expect(source).toContain("this.team.emit(\"died\", this)")
        expect(source).toContain("this.emit(\"died\")")
        expect(source).toContain("wipeCheck()")
        expect(source).toContain("this.scene.finishRound()")
    })

    it("merges, equips, unequips, and syncs items through movement listeners", () => {
        const source = creatureSource()

        expect(source).toContain("getMergeResult(item: Item)")
        expect(source).toContain("Item.getMergeResult")
        expect(source).toContain("tryMerge(item: Item)")
        expect(source).toContain("ItemRegistry.create")
        expect(source).toContain("Item.resetTooltip()")
        expect(source).toContain("hasThiefsGloves()")
        expect(source).toContain("equipItem(_item: Item")
        expect(source).toContain("item.drop()")
        expect(source).toContain("this.items.add(item)")
        expect(source).toContain("this.on(\"move\", item.syncPosition, item)")
        expect(source).toContain("unequipItem(item: Item")
        expect(source).toContain("item.cleanup(this)")
        expect(source).toContain("this.off(\"move\", item.syncPosition, item)")
    })

    it("adds and removes auras with immediate apply and cleanup", () => {
        const source = creatureSource()

        expect(source).toContain("addAura(aura: Aura)")
        expect(source).toContain("this.auras.add(aura)")
        expect(source).toContain("aura.tryApply(this)")
        expect(source).toContain("removeAura(aura: Aura)")
        expect(source).toContain("aura.cleanup(this)")
        expect(source).toContain("this.auras.delete(aura)")
    })

    it("updates UI, targeting, self update, mana, status effects, and idle guard", () => {
        const source = creatureSource()

        expect(source).toContain("updateCharUi()")
        expect(source).toContain("selfUpdate(delta: number)")
        expect(source).toContain("this.updateDepth()")
        expect(source).toContain("this.regenMana(delta)")
        expect(source).toContain("for (const effect of this.statusEffects)")
        expect(source).toContain("effect.update(delta)")
        expect(source).toContain("withTargetUpdate()")
        expect(source).toContain("this.isInAttackRange()")
        expect(source).toContain("this.startAttack()")
        expect(source).toContain("this.moveToTarget()")
        expect(source).toContain("this.avoidOtherCharacters()")
        expect(source).toContain("override update(time: number, delta: number)")
        expect(source).toContain("if (this.scene.state === \"idle\")")
    })
})
