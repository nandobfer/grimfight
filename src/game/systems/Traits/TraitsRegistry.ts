import { RNG } from "../../tools/RNG"
import { AssassinTrait } from "./AssassinTrait"
import { AttackerTrait } from "./AttackerTrait"
import { ColossusTrait } from "./ColossusTrait"
import { DeathEaterTrait } from "./DeathEaterTrait"
import { DruidTrait } from "./DruidTrait"
import { IncendiaryTrait } from "./IncendiaryTrait"
import { NobleTrait } from "./NobleTrait"
import { PackTrait } from "./PackTrait"
import { SorcererTrait } from "./SorcererTrait"
import { SpeedyTrait } from "./SpeedyTrait"
import { Trait } from "./Trait"

type Ctor = new (comp: string[]) => Trait

export class TraitsRegistry {
    private static registry: Map<string, { ctor: Ctor; comp: string[] }> = new Map()

    static register(name: string, ctor: Ctor, comp: string[] = []) {
        this.registry.set(name, { ctor, comp })
    }
    static create(name: string, data?: Trait): Trait {
        const entry = this.registry.get(name)
        if (!entry) throw new Error(`Trait not found: ${name}`)
        const CustomTrait = entry.ctor
        const augment = new CustomTrait(entry.comp)

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
    static entries(): Array<{ name: string; entry: { ctor: Ctor; comp: string[] } }> {
        return [...this.registry.entries()].map(([name, entry]) => ({ name, entry }))
    }

    static random(exclude: string[] = []) {
        const name = RNG.pick(this.names().filter((item) => !exclude.includes(item)))
        const augment = this.create(name)
        return augment
    }

    static randomList(quantity: number) {
        return Phaser.Utils.Array.Shuffle(TraitsRegistry.names())
            .slice(0, quantity)
            .map((aug) => TraitsRegistry.create(aug))
    }

    static compTraits(comp: string[]) {
        const entries = this.entries()
        const matchingTraits = entries
            .filter((entry) => entry.entry.comp.some((c) => comp.includes(c)))
            .map((entry) => {
                const CustomTrait = entry.entry.ctor
                return new CustomTrait(entry.entry.comp)
            })
        console.log({ entries, comp, matchingTraits })
        return matchingTraits
    }
}

TraitsRegistry.register("Atacante", AttackerTrait, ["grok", "mordred", "arthas", "vania", "laherce"])
TraitsRegistry.register("Colosso", ColossusTrait, ["maximus", "grok", "frank"])
TraitsRegistry.register("Ligeiro", SpeedyTrait, ["lizwan", "statikk", "vania", "frank"])
TraitsRegistry.register("Assassino", AssassinTrait, ["lizwan", "mordred"])
TraitsRegistry.register("Feiticeiro", SorcererTrait, ["megumin", "jadis", "zairon", "helyna"])
TraitsRegistry.register("Deatheater", DeathEaterTrait, ["zairon", "arthas", "frank"])
TraitsRegistry.register("Matilha", PackTrait, ["lizwan", "helyna", "laherce", "banguela"])
TraitsRegistry.register("Druid", DruidTrait, ["helyna"])
TraitsRegistry.register("Incendiário", IncendiaryTrait, ["banguela", "megumin"])
TraitsRegistry.register("Nobre", NobleTrait, ["maximus", "jadis", "statikk"]) // falta vampiro
