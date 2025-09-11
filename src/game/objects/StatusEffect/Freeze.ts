import { Creature } from "../../creature/Creature"
import { Frozen } from "../../fx/Frozen"
import { Condition } from "./Condition"

export class Freeze extends Condition {
    constructor(target: Creature, user: Creature, duration: number) {
        super({
            attributes: ["frozen"],
            values: [true],
            duration: duration,
            target: target,
            user: user,
            renderFx: () => new Frozen(user?.scene || target.scene, target.x, target.y, target),
        })
    }
}
