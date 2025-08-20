// src/game/characters/monsters/MonsterRegistry.ts
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"
import { Skeleton } from "./Skeleton"
import { Zombie } from "./Zombie"
import { Demonic } from "./Zombie copy"

type Ctor = new (scene: Game, x: number, y: number) => Monster

export class MonsterRegistry {
    private static registry: Map<string, Ctor> = new Map()

    static register(name: string, cls: Ctor) {
        this.registry.set(name, cls)
    }
    static create(name: string, scene: Game, x: number, y: number): Monster {
        const C = this.registry.get(name)
        if (!C) throw new Error(`Monster not found: ${name}`)
        return new C(scene, x, y)
    }
    static names(): string[] {
        return [...this.registry.keys()]
    }
    static entries(): Array<{ name: string; ctor: Ctor }> {
        return [...this.registry.entries()].map(([name, ctor]) => ({ name, ctor }))
    }
}

MonsterRegistry.register("skeleton", Skeleton)
MonsterRegistry.register("zombie", Zombie)
MonsterRegistry.register("demonic", Demonic)
