import { Creature } from "../../creature/Creature"
import { FxSprite } from "../../fx/FxSprite"
import { StatusEffect, StatusEffectParams } from "./StatusEffect"

export interface ConditionParams extends StatusEffectParams {
    attributes: (keyof Creature)[]
    values: any[]
    renderFx?: () => FxSprite
}

export class Condition extends StatusEffect {
    attributes: (keyof Creature)[]
    values: any[]
    renderFx?: () => FxSprite
    fxSprite?: FxSprite

    constructor(params: ConditionParams) {
        super(params)
        this.attributes = params.attributes
        this.values = params.values
        this.renderFx = params.renderFx
        this.onAfterExpire = params.onExpire
    }

    override onApply(): void {
        if (this.values.length !== this.attributes.length) throw "quantidade de atributos e valores deve ser a mesma, idiota!"
        super.onApply()

        for (const [index, key] of this.attributes.entries()) {
            if (!this.target.conditionsValues.has(key)) {
                this.target.conditionsValues.set(key, this.target[key])
            }
            // @ts-expect-error
            this.target[key] = this.values[index]
        }

        if (this.renderFx) {
            try {
                this.fxSprite = this.renderFx()
            } catch (error) {
                console.log(error)
            }
        }
    }

    override onExpire(): void {
        super.onExpire()

        for (const attribute of this.attributes) {
            const originalValue = this.target.conditionsValues.get(attribute)
            if (originalValue !== undefined) {
                // @ts-expect-error
                this.target[attribute] = originalValue
                this.target.conditionsValues.delete(attribute)
            }
        }

        if (this.fxSprite) {
            this.fxSprite.cleanup()
        }
    }
}
