import { Game } from "../../scenes/Game"
import { DamageChart } from "../../tools/DamageChart"
import { CreatureGroup } from "../CreatureGroup"
import { Character } from "./Character"

export class CharacterGroup extends CreatureGroup {
    damageChart: DamageChart

    constructor(
        scene: Game,
        children?: Character[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
        this.damageChart = new DamageChart(this)
    }

    override getChildren() {
            return super.getChildren() as Character[]
        }
}
