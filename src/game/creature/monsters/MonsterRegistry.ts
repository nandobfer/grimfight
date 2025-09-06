// src/game/characters/monsters/MonsterRegistry.ts
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"
import { Skeleton } from "./Skeleton"
import { Zombie } from "./Zombie"
import { Demonic } from "./Demonic"
import { StatsLike } from "../../tools/ChallengeRating"
import { ArmoredSkeleton } from "./ArmoredSkeleton"
import { EvilFanatic } from "./EvilFanatic"
import { Mantis } from "./Mantis"
import { IceDemonic } from "./IceDemonic"
import { ArcherSkeleton } from "./ArcherSkeleton"
// import { Ifrit } from "./Ifrit"

const CR_1_MONSTER: Record<string, StatsLike> = {
    skeleton: {
        baseMaxHealth: 400,
        baseArmor: 0,
        baseResistance: 0,
        baseAttackDamage: 15,
        baseAttackSpeed: 1,
        baseCritChance: 0,
        baseCritDamageMultiplier: 2,
        baseAttackRange: 1,
        baseSpeed: 30,
    },
}

type Ctor = new (scene: Game) => Monster

export class MonsterRegistry {
    private static registry: Map<string, Ctor> = new Map()

    static register(name: string, cls: Ctor) {
        this.registry.set(name, cls)
    }
    static create(name: string, scene: Game): Monster {
        const C = this.registry.get(name)
        if (!C) throw new Error(`Monster not found: ${name}`)
        return new C(scene)
    }
    static names(): string[] {
        return [...this.registry.keys()]
    }
    static entries(): Array<{ name: string; ctor: Ctor }> {
        return [...this.registry.entries()].map(([name, ctor]) => ({ name, ctor }))
    }

    static getBaseStats(id: keyof typeof CR_1_MONSTER): StatsLike {
        // return a copy to avoid accidental mutation
        return { ...CR_1_MONSTER[id] }
    }
}

MonsterRegistry.register("skeleton", Skeleton)
MonsterRegistry.register("zombie", Zombie)
MonsterRegistry.register("demonic", Demonic)
MonsterRegistry.register("ice_demonic", IceDemonic)
MonsterRegistry.register("armored_skeleton", ArmoredSkeleton)
MonsterRegistry.register("archer_skeleton", ArcherSkeleton)
MonsterRegistry.register("evil_fanatic", EvilFanatic)
// MonsterRegistry.register("ifrit", Ifrit)
MonsterRegistry.register("mantis", Mantis)
