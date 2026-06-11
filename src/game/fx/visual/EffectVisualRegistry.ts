import { EffectVisualDefinition } from "./EffectVisualDefinition"

export class EffectVisualRegistry {
    private static registry = new Map<string, EffectVisualDefinition>()

    static register(name: string, visual: EffectVisualDefinition): void {
        this.registry.set(name, visual)
    }

    static get(name: string): EffectVisualDefinition | undefined {
        return this.registry.get(name)
    }

    static preload(scene: Phaser.Scene): void {
        for (const visual of this.registry.values()) {
            visual.preload(scene)
        }
    }
}
