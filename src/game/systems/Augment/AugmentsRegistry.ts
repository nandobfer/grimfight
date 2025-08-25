import { Augment } from "./Augment"
import { ColossusAugment } from "./ColossusAugment"

type Ctor = new () => Augment

export class AugmentsRegistry {
    private static registry: Map<string, Ctor> = new Map()

    static register(name: string, cls: Ctor) {
        this.registry.set(name, cls)
    }
    static create(name: string): Augment {
        const C = this.registry.get(name)
        if (!C) throw new Error(`Augment not found: ${name}`)
        return new C()
    }
    static names(): string[] {
        return [...this.registry.keys()]
    }
    static entries(): Array<{ name: string; ctor: Ctor }> {
        return [...this.registry.entries()].map(([name, ctor]) => ({ name, ctor }))
    }

}

AugmentsRegistry.register("colossus", ColossusAugment)
