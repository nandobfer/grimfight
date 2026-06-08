import { CreatureVisualDefinition } from "./CreatureVisualDefinition"

export class CreatureVisualRegistry {
    private static registry = new Map<string, CreatureVisualDefinition>()

    static register(name: string, visual: CreatureVisualDefinition): void {
        this.registry.set(name, visual)
    }

    static get(name: string): CreatureVisualDefinition | undefined {
        return this.registry.get(name)
    }

    static preload(names: readonly string[], scene: Phaser.Scene): void {
        for (const name of names) {
            const visual = this.registry.get(name)
            if (!visual) {
                throw new Error(`Creature visual definition not found: ${name}`)
            }
            visual.preload(scene)
        }
    }
}
