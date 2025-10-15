import { Creature } from "../creature/Creature"
import { MonsterRegistry } from "../creature/monsters/MonsterRegistry"
import { MagicCircleFx } from "../fx/MagicCircleFx"

export interface SummonOpts {
    abilityPower: number
    attackPower: number
    maxHealth: number
    scale: number
    speed: number
}

export class Summon {
    static summon(monster: string, master: Creature, opts?: Partial<SummonOpts>) {
        const summon = MonsterRegistry.create(monster, master.scene)
        summon.master = master
        master.team.minions.add(summon)
        const { x, y } = master.randomPointAround(true)
        new MagicCircleFx(master.scene, x, y)

        summon.teleportTo(x, y)
        summon.boardX = master.boardX
        summon.boardY = master.boardY

        summon.baseAbilityPower += opts?.abilityPower || 0
        summon.baseAttackDamage += opts?.attackPower || 0
        summon.baseMaxHealth += opts?.maxHealth || 0
        summon.baseScale = opts?.scale || master.baseScale
        summon.baseSpeed = opts?.speed || master.baseSpeed

        summon.reset()
        summon.applyAuras()
        summon.target = master.target

        return summon
    }
}
