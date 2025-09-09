import { RNG } from "../../tools/RNG"
import { AttackerAugment } from "./AttackerAugment"
import { Augment } from "./Augment"
import { BattlemageAugment } from "./BattlemageAugment"
import { BonusGoldAugment } from "./BonusGoldAugment"
import { BonusHealthAugment } from "./BonusHealthAugment"
import { CasterAugment } from "./CasterAugment"
import { ColossusAugment } from "./ColossusAugment"
import { CriticalAugment } from "./CriticalAugment"
import { DevastatorAugment } from "./DevastatorAugment"
import { DexterousAugment } from "./DexterousAugment"
import { ItemAugment } from "./ItemAugment"
import { LifedrinkerAugment } from "./LifedrinkerAugment"
import { PowerfulAugment } from "./PowerfulAugment"
import { SniperAugment } from "./SniperAugment"

type Ctor = new () => Augment

export class AugmentsRegistry {
    private static registry: Map<string, Ctor> = new Map()

    static register(name: string, cls: Ctor) {
        this.registry.set(name, cls)
    }
    static create(name: string, data?: Augment): Augment {
        const CustomAugment = this.registry.get(name)
        if (!CustomAugment) throw new Error(`Augment not found: ${name}`)
        const augment = new CustomAugment()

        if (data) {
            for (const [key, value] of Object.entries(data)) {
                // @ts-ignore
                augment[key] = value
            }
        }

        return augment
    }
    static names(): string[] {
        return [...this.registry.keys()]
    }
    static entries(): Array<{ name: string; ctor: Ctor }> {
        return [...this.registry.entries()].map(([name, ctor]) => ({ name, ctor }))
    }

    static random(exclude: string[] = []) {
        const name = RNG.pick(this.names().filter((item) => !exclude.includes(item)))
        const augment = this.create(name)
        return augment
    }

    static randomList(quantity: number) {
        return Phaser.Utils.Array.Shuffle(AugmentsRegistry.names())
            .slice(0, quantity)
            .map((aug) => AugmentsRegistry.create(aug))
    }
}

AugmentsRegistry.register("colossus", ColossusAugment)
// AugmentsRegistry.register("battlemage", BattlemageAugment)
// AugmentsRegistry.register("lifedrinker", LifedrinkerAugment)
AugmentsRegistry.register("attacker", AttackerAugment)
AugmentsRegistry.register("bonusgold", BonusGoldAugment)
AugmentsRegistry.register("bonushealth", BonusHealthAugment)
AugmentsRegistry.register("caster", CasterAugment)
AugmentsRegistry.register("powerful", PowerfulAugment)
AugmentsRegistry.register("sniper", SniperAugment)
AugmentsRegistry.register("dexterous", DexterousAugment)
AugmentsRegistry.register("critical", CriticalAugment)
AugmentsRegistry.register("devastator", DevastatorAugment)
AugmentsRegistry.register("item", ItemAugment)
