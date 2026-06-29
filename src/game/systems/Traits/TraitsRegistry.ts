import { RNG } from "../../tools/RNG"
import { ArcanistTrait } from "./ArcanistTrait"
import { AssassinTrait } from "./AssassinTrait"
import { AttackerTrait } from "./AttackerTrait"
import { ClericTrait } from "./ClericTrait"
import { ColossusTrait } from "./ColossusTrait"
import { DeathEaterTrait } from "./DeathEaterTrait"
import { DruidTrait } from "./DruidTrait"
import { FeralTrait } from "./FeralTrait"
import { HolyTrait } from "./HolyTrait"
import { IncendiaryTrait } from "./IncendiaryTrait"
import { NobleTrait } from "./NobleTrait"
import { PoisonerTrait } from "./PoisonerTrait"
import { WinterTrait } from "./WinterTrait"
import { SorcererTrait } from "./SorcererTrait"
import { SpeedyTrait } from "./SpeedyTrait"
import { SniperTrait } from "./SniperTrait"
import { Trait } from "./Trait"

type Ctor = new (comp: string[]) => Trait

export class TraitsRegistry {
    private static registry: Map<string, { ctor: Ctor; comp: string[] }> = new Map()

    static register(name: string, ctor: Ctor, comp: string[] = []) {
        this.registry.set(name, { ctor, comp })
    }
    static getAllRegistered(): string[] {
        return Array.from(this.registry.keys())
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

TraitsRegistry.register("Attacker", AttackerTrait, ["grok", "mordred", "vania", "laherce", "chichi", "clover"])
TraitsRegistry.register("Arcanist", ArcanistTrait, ["freud", "yue", "zairon", "dranho", "robilton", "silvia", "lucio"])
TraitsRegistry.register("Colossi", ColossusTrait, ["maximus", "grok", "frank", "ymir", "lalatina", "rokmora", "ragnaros", "silvia", "saulo"])
TraitsRegistry.register("Swift", SpeedyTrait, ["lizwan", "statikk", "vania", "frank", "chichi", "robilton"])
TraitsRegistry.register("Assassin", AssassinTrait, ["lizwan", "mordred", "dracula", "rukia", "freud", "fandral"])
TraitsRegistry.register("Sorcerer", SorcererTrait, ["megumin", "jadis", "zairon", "silvia", "clover", "melo"])
TraitsRegistry.register("Deatheater", DeathEaterTrait, ["zairon", "arthas", "frank", "dracula", "lucio"])
TraitsRegistry.register("Poisoner", PoisonerTrait, ["lizwan", "saulo", "lucio", "nala"])
TraitsRegistry.register("Druid", DruidTrait, ["helyna", "rokmora", "fandral"])
TraitsRegistry.register("Incendiary", IncendiaryTrait, ["banguela", "megumin", "yue", "fandral", "melisandre", "ragnaros"])
TraitsRegistry.register("Noble", NobleTrait, ["maximus", "jadis", "statikk", "dracula", "arthas"])
TraitsRegistry.register("Winter", WinterTrait, ["reno", "jadis", "rukia", "ymir", "arthas", "jacrost"])
TraitsRegistry.register("Holy", HolyTrait, ["lalatina", "melo"])
TraitsRegistry.register("Cleric", ClericTrait, ["melo", "jacrost", "melisandre", "dranho"])
TraitsRegistry.register("Sniper", SniperTrait, ["laherce", "nala", "reno", "freud"])
TraitsRegistry.register("Feral", FeralTrait, ["nala", "banguela", "helyna", "grok"])
