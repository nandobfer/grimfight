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
import { SkeletonArcher } from "./SkeletonArcher"
import { SkeletonAssassin } from "./SkeletonAssassin"
import { SkeletonNecromancer } from "./SkeletonNecromancer"
import { SkeletonDrainer } from "./SkeletonDrainer"
import { SkeletonPyromancer } from "./SkeletonPyromancer"
import { SkeletonCryomancer } from "./SkeletonCryomancer"
// import { Ifrit } from "./Ifrit"

const CR_1_MONSTER: Record<string, StatsLike> = {
    skeleton: {
        baseMaxHealth: 400,
        baseArmor: 0,
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
    private static normalRegistry: Map<string, Ctor> = new Map()

    static register(name: string, cls: Ctor, normal = true) {
        this.registry.set(name, cls)
        if (normal) this.normalRegistry.set(name, cls)
    }
    static create(name: string, scene: Game): Monster {
        const C = this.registry.get(name)
        if (!C) throw new Error(`Monster not found: ${name}`)
        return new C(scene)
    }
    static names(): string[] {
        return [...this.registry.keys()]
    }

    static normalMonstersNames(): string[] {
        return [...this.normalRegistry.keys()]
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
MonsterRegistry.register("skeleton_archer", SkeletonArcher)
MonsterRegistry.register("skeleton_assassin", SkeletonAssassin)
MonsterRegistry.register("skeleton_necromancer", SkeletonNecromancer)
MonsterRegistry.register("skeleton_drainer", SkeletonDrainer)
MonsterRegistry.register("skeleton_pyromancer", SkeletonPyromancer)
MonsterRegistry.register("skeleton_cryomancer", SkeletonCryomancer)
MonsterRegistry.register("evil_fanatic", EvilFanatic, false)
MonsterRegistry.register("mantis", Mantis, false)
