// src/game/scenes/Game.ts

import { EventBus } from "../tools/EventBus"
import { Scene } from "phaser"
import { Grid } from "../tools/Grid"
import { CharacterRegistry } from "../creature/CharacterRegistry"
import { FireEffect } from "../fx/FireEffect"
import { generateEncounter } from "../tools/Encounter"
import { MonsterGroup } from "../creature/monsters/MonsterGroup"
import { CharacterGroup } from "../creature/character/CharacterGroup"
import { Character, CharacterDto } from "../creature/character/Character"
import { DamageType } from "../ui/DamageNumbers"
import { spawnParrySpark } from "../fx/Parry"
import { ColdHit } from "../fx/ColdHit"
import { FireHit } from "../fx/FireHit"
import { Creature } from "../creature/Creature"
import { PoisonHit } from "../fx/PoisonHit"
import { AugmentsRegistry } from "../systems/Augment/AugmentsRegistry"
import { Augment } from "../systems/Augment/Augment"
import { LightningHit } from "../fx/LightningHit"
import { GoldCoinFx } from "../fx/GoldExplosion"
import { Shopkeeper } from "../systems/Shopkeeper"

export type GameState = "fighting" | "idle"

export interface GameProgressDto {
    playerLives: number
    playerGold: number
    floor: number
    version?: string
    playerAugments: Augment[]
    enemyAugments: Augment[]
}

export const starting_player_lives = 3
export const starting_player_gold = 1
export const max_characters_in_board = 6
export const max_bench_size = 9

export class Game extends Scene {
    version = "v1.0.6"
    camera: Phaser.Cameras.Scene2D.Camera
    background: Phaser.GameObjects.Image
    gameText: Phaser.GameObjects.Text
    playerTeam: CharacterGroup
    enemyTeam: MonsterGroup
    state: GameState = "idle"
    walls: Phaser.GameObjects.Group
    floor = 1
    grid: Grid
    private fireEffects: Phaser.GameObjects.Group
    goldCoinFx: GoldCoinFx
    shopkeeper: Shopkeeper

    playerGold = starting_player_gold
    playerLives = starting_player_lives
    max_characters_in_board = max_characters_in_board
    max_bench_size = max_bench_size

    private uiGhost?: Character
    private dragFromBoard = new Map<string, Character>()

    constructor() {
        super("Game")
    }

    create() {
        this.physics.world.createDebugGraphic()
        this.physics.world.debugGraphic.visible = false
        this.camera = this.cameras.main

        this.createBackground()
        this.grid = new Grid(this, this.background)
        this.goldCoinFx = new GoldCoinFx(this)
        this.playerTeam = new CharacterGroup(this, true)
        this.enemyTeam = new MonsterGroup(this, true)
        this.shopkeeper = new Shopkeeper(this)

        this.configurePhysics()
        this.createLight()

        this.enemyTeam.reset()

        this.loadPlayerCharacters()
        this.loadProgress()
        this.createArenaTorches()
        this.buildFloor()

        this.input.keyboard?.on("keydown-D", () => {
            const currentlyDebugging = this.physics.world.debugGraphic.visible
            this.physics.world.debugGraphic.visible = !currentlyDebugging
            console.log(`Physics debug: ${!currentlyDebugging}`)
        })

        EventBus.emit("game-ready", this)
        EventBus.on("get-progress", () => this.emitProgress())
        EventBus.on("ui-augment", () => this.handleAugmentsFloor())
        this.installUiDragBridge()
        this.installBenchHoverBridge()
    }

    createLight() {
        this.lights.enable().setAmbientColor(0xaaaaaa)
    }

    createBackground() {
        this.background = this.add.image(this.camera.width / 2, this.camera.height / 2, "arena")
        this.background.setDepth(-2)
        this.background.setScale(0.6)
        this.background.setPipeline("Light2D")

        // Walls (invisible colliders)
        const thickness = 50 // adjust to match your arena border thickness
        const arenaWidth = this.background.displayWidth
        const arenaHeight = this.background.displayHeight
        const centerX = this.camera.width / 2
        const centerY = this.camera.height / 2

        this.walls = this.physics.add.staticGroup()

        // Top wall
        this.walls
            .create(centerX, centerY + 68 - arenaHeight / 2)
            .setDisplaySize(arenaWidth, thickness)
            .setVisible(false)
            .refreshBody()

        // Bottom wall
        this.walls
            .create(centerX, centerY - 90 + arenaHeight / 2)
            .setDisplaySize(arenaWidth, thickness)
            .setVisible(false)
            .refreshBody()

        // Left wall
        this.walls
            .create(centerX + 72 - arenaWidth / 2, centerY)
            .setDisplaySize(thickness, arenaHeight)
            .setVisible(false)
            .refreshBody()

        // Right wall
        this.walls
            .create(centerX - 72 + arenaWidth / 2, centerY)
            .setDisplaySize(thickness, arenaHeight)
            .setVisible(false)
            .refreshBody()
    }

    configurePhysics() {
        this.physics.add.overlap(this.playerTeam, this.playerTeam)
        this.physics.add.overlap(this.playerTeam, this.enemyTeam)
        this.physics.add.overlap(this.enemyTeam, this.enemyTeam)

        this.physics.add.collider(this.walls, this.playerTeam)
        this.physics.add.collider(this.walls, this.enemyTeam)
    }

    private installUiDragBridge() {
        EventBus.on("ui-drag-start", (payload: { dto: CharacterDto; clientX: number; clientY: number }) => {
            if (this.state === "fighting") return
            const { dto, clientX, clientY } = payload

            // Build a character instance WITHOUT adding to the team yet
            const ghost = CharacterRegistry.create(dto.name, this, dto.id, 0, 0)
            ghost.loadFromDto(dto) // level etc.
            ghost.body.enable = false // no physics until we drop
            ghost.setAlpha(0.95).setDepth(9999)
            ghost.disableInteractive() // we control it manually
            ghost.anims.play(`${ghost.name}-idle-down`, true)

            this.shopkeeper.onCharacterDragGlow(true)
            this.shopkeeper.renderCharacterCost(ghost)

            // place at pointer
            const { x, y } = this.clientToWorld(clientX, clientY)
            ghost.setPosition(x, y)
            ghost.body?.reset(x, y)

            this.uiGhost = ghost
            this.grid.showDropOverlay()
        })

        EventBus.on("ui-drag-move", ({ clientX, clientY }: { clientX: number; clientY: number }) => {
            if (!this.uiGhost) return
            const { x, y } = this.clientToWorld(clientX, clientY)
            this.uiGhost.setPosition(x, y)
            this.grid.showHighlightAtWorld(x, y)
        })

        EventBus.on("ui-drag-end", ({ clientX, clientY }: { clientX: number; clientY: number }) => {
            if (!this.uiGhost) return
            const ghost = this.uiGhost
            this.uiGhost = undefined

            const { x, y } = this.clientToWorld(clientX, clientY)

            // Try to snap; if success, add to team (CharacterGroup.add will respect boardX/Y)
            const snapped = this.grid.snapCharacter(ghost, x, y)
            this.grid.hideHighlight()
            this.grid.hideDropOverlay()
            this.shopkeeper.onCharacterDragGlow(false)
            this.shopkeeper.hideCharacterCost()

            const shopkeeperBounds = this.shopkeeper.getBounds()
            if (shopkeeperBounds.contains(x, y)) {
                EventBus.emit("sell-character-shopkeeper", ghost)
                ghost.destroy(true)
                return
            }

            if (snapped && !this.playerTeam.isBoardFull()) {
                // snapCharacter already set boardX/boardY on the ghost
                ghost.body.enable = true
                this.playerTeam.add(ghost) // will NOT auto-reposition because boardX/boardY are set
                ghost.resetMouseEvents()
                this.playerTeam.saveCurrentCharacters()
                this.playerTeam.emitArray()
                this.playerTeam.bench.remove(ghost.id)
            } else {
                ghost.destroy(true) // cancel: didn’t drop in a valid tile
            }
        })
    }

    private installBenchHoverBridge() {
        // Keep track of which character is being dragged
        EventBus.on("ph-drag-start", ({ id }: { id: string }) => {
            const ch = this.playerTeam.getById(id)
            if (ch) this.dragFromBoard.set(id, ch)
        })

        // React will tell us when pointer enters/leaves the bench area
        EventBus.on("bench-hover-enter", ({ id }: { id: string }) => {
            const ch = this.dragFromBoard.get(id)
            if (!ch) return
            ch.setVisible(false)
            ch.body.enable = false
            // (Optional) add a subtle marker in-world if you want
        })

        EventBus.on("bench-hover-leave", ({ id }: { id: string }) => {
            const ch = this.dragFromBoard.get(id)
            if (!ch) return
            ch.setVisible(true)
            ch.body.enable = true
        })

        // Commit: destroy in-world and add to bench
        EventBus.on("bench-drop", ({ id, dto }: { id: string; dto: CharacterDto }) => {
            const ch = this.dragFromBoard.get(id)
            if (!ch) return
            ch.dropToBench = true // tells dragend to skip snapping logic
            ch.destroy(true)
            this.playerTeam.bench.add(dto) // your Bench.add will emit to UI
            this.dragFromBoard.delete(id)
        })

        // Cancel: not dropped on bench; restore and let the character's dragend do its normal snap/revert
        EventBus.on("bench-cancel", ({ id }: { id: string }) => {
            const ch = this.dragFromBoard.get(id)
            if (!ch) return
            ch.setVisible(true)
            ch.body.enable = true
            this.dragFromBoard.delete(id)
        })
    }

    // Map browser client coords -> world coords under the camera, robust to CSS scaling + DPR
    private clientToWorld(clientX: number, clientY: number) {
        // ScaleManager expects *page* coords; add current scroll offset
        const pageX = clientX + window.scrollX
        const pageY = clientY + window.scrollY

        // Transform into game-space coords (relative to the canvas)
        const gx = this.scale.transformX(pageX)
        const gy = this.scale.transformY(pageY)

        // Finally, to world space via the active camera
        const p = this.cameras.main.getWorldPoint(gx, gy)
        return { x: p.x, y: p.y }
    }

    changeScene() {
        this.scene.start("GameOver")
    }

    changeState(state: GameState) {
        this.state = state
        EventBus.emit("gamestate", this.state)
        EventBus.emit("select-char", null)
    }

    startRound() {
        this.enemyTeam.reset()
        this.playerTeam.reset()
        this.changeState("fighting")
        this.playerTeam.damageChart.reset()
    }

    finishRound() {
        this.playerTeam.reset()
    }

    onFloorDefeated() {
        const goldGained = this.playerTeam.grantFloorReward(this.floor)
        this.goldCoinFx.explodeCameraCenterToCounter(goldGained)
        this.floor += 1
        this.clearFloor()
        this.buildFloor()
        EventBus.emit("floor-change", this.floor)
        this.saveProgress()
    }

    clearFloor() {
        this.enemyTeam.clear(true, true)
    }

    buildFloor() {
        const { monsters } = generateEncounter(this, this.floor)

        // add to group; positions come from enemyTeam.reset() honoring preferredPosition
        for (const m of monsters) {
            this.enemyTeam.add(m)
        }

        this.handleEnemiesAugments()
        this.resetFloor()

        this.handleAugmentsFloor()
    }

    handleEnemiesAugments() {
        if (this.floor === 1 || (this.floor - 1) % 5 !== 0) {
            return
        }
        const enemiesAugments = Array.from(this.enemyTeam.augments.values())
        if (enemiesAugments.find((augment) => augment.chosenFloor === this.floor)) return

        const excludeList = ["bonusgold", "bonushealth"]
        const randomAugment = AugmentsRegistry.random(excludeList)
        this.enemyTeam.addAugment(randomAugment)
        console.log(this.enemyTeam.augments)
    }

    handleAugmentsFloor() {
        if (this.floor % 5 !== 0) {
            return
        }

        const playerAugments = Array.from(this.playerTeam.augments.values())
        if (playerAugments.find((augment) => augment.chosenFloor === this.floor)) return

        const augments = AugmentsRegistry.randomList(3)

        EventBus.emit("choose-augment", augments)
    }

    resetFloor() {
        this.enemyTeam.reset()
        this.playerTeam.reset()
        this.changeState("idle") // wait for player to start
    }

    onPlayerDefeated() {
        this.changePlayerLives(this.playerLives - 1)

        if (this.playerLives === 0) {
            this.gameOver()
            return
        }

        this.resetFloor()
        this.saveProgress()
    }

    changePlayerLives(lives: number) {
        this.playerLives = lives
        EventBus.emit("lives-change", lives)
        this.saveProgress()
    }

    anyTeamWiped() {
        if (this.enemyTeam.isWiped()) {
            this.onFloorDefeated()
            return true
        }

        if (this.playerTeam.isWiped()) {
            this.onPlayerDefeated()
            return true
        }

        return false
    }

    gameOver() {
        this.resetProgress()
        this.clearFloor()
        this.buildFloor()
        this.playerTeam.bench.clear()
        this.playerTeam.store.shuffle()

        EventBus.emit("gameover")
    }

    resetProgress() {
        this.floor = 1
        this.playerLives = starting_player_lives
        this.playerGold = starting_player_gold
        this.resetAugments()
        this.saveProgress()
        this.emitProgress()
        this.savePlayerCharacters([])
        this.loadPlayerCharacters()
    }

    resetAugments() {
        this.playerTeam.augments.clear()
        this.enemyTeam.augments.clear()
        this.playerTeam.emitAugments()
    }

    getSavedCharacters(): CharacterDto[] {
        try {
            const data = localStorage.getItem("characters")
            if (data) {
                return JSON.parse(data) as CharacterDto[]
            }
        } catch (error) {
            console.error("Error loading saved characters:", error)
        }
        return []
    }

    loadPlayerCharacters() {
        this.playerTeam.clear(true, true)
        const characters = this.getSavedCharacters()

        for (const dto of characters) {
            try {
                const character = CharacterRegistry.create(dto.name, this, dto.id, dto.boardX, dto.boardY)
                character.loadFromDto(dto)
                this.playerTeam.add(character)
            } catch (error) {
                console.error("Error creating character:", error)
            }
        }

        this.playerTeam.reset()
        this.playerTeam.damageChart.emitArray()

        if (this.playerTeam.getLength() === 0) {
            // this.generateFirstCharacter()
        }
    }

    savePlayerCharacters(characters: CharacterDto[]) {
        try {
            localStorage.setItem("characters", JSON.stringify(characters))
        } catch (error) {
            console.error("Error saving characters:", error)
        }
    }

    saveProgress() {
        const data = this.getProgress()
        try {
            localStorage.setItem("progress", JSON.stringify(data))
        } catch (error) {
            console.error("Error saving progress:", error)
        }
    }

    getProgress() {
        const progress: GameProgressDto = {
            floor: this.floor,
            playerGold: this.playerGold,
            playerLives: this.playerLives,
            version: this.version,
            playerAugments: Array.from(this.playerTeam.augments.values()),
            enemyAugments: Array.from(this.enemyTeam.augments.values()),
        }
        return progress
    }

    loadProgress() {
        try {
            const data = localStorage.getItem("progress")
            if (data) {
                const progress = JSON.parse(data) as GameProgressDto

                if (this.version !== progress.version) {
                    this.gameOver()
                    return
                }

                this.floor = progress.floor
                this.playerGold = progress.playerGold
                this.playerLives = progress.playerLives

                progress.playerAugments.forEach((aug) => this.playerTeam.augments.add(AugmentsRegistry.create(aug.name, aug)))
                progress.enemyAugments.forEach((aug) => this.enemyTeam.augments.add(AugmentsRegistry.create(aug.name, aug)))
                console.log(this.playerTeam.augments)
                console.log(this.enemyTeam.augments)
                this.playerTeam.emitAugments()
            }
        } catch (error) {
            console.error("Error loading saved progress:", error)
        }
    }

    emitProgress() {
        const progress = this.getProgress()
        EventBus.emit("load-progress", progress)
    }

    changePlayerGold(gold: number) {
        this.playerGold = gold
        EventBus.emit("gold-change", gold)
        this.saveProgress()
    }

    // ! usada naquele modalzinho de selecionar boneco, não está sendo usado mais, mas por motivos de debug, deixei aqui
    newPlayerCharacter(dto: CharacterDto) {
        const characters = this.getSavedCharacters()

        // Check if character with this ID already exists
        const existingIndex = characters.findIndex((c) => c.id === dto.id)
        if (existingIndex >= 0) {
            // Update existing character
            characters[existingIndex] = dto
        } else {
            // Add new character
            characters.push(dto)
        }

        this.savePlayerCharacters(characters)
        this.loadPlayerCharacters() // Reload to reflect changes
    }

    // Add this method to clear all characters
    clearAllCharacters() {
        this.savePlayerCharacters([])
        this.loadPlayerCharacters()
    }

    generateFirstCharacter() {
        const randomCharacter = CharacterRegistry.random(this)
        this.playerTeam.add(randomCharacter)
        this.playerTeam.reset()
    }

    onHitFx(damageType: DamageType, _x: number, _y: number, target?: Creature) {
        const x = target?.x || _x
        const y = target?.y || _y

        switch (damageType) {
            // case "block":
            //     return spawnParrySpark(this, x, y)
            case "cold":
                return new ColdHit(this, x, y)
            case "fire":
                return new FireHit(this, x, y)
            case "lightning":
                return new LightningHit(this, x, y)
            case "normal":
                return target ? target.onNormalHit() : null
            case "poison":
                return new PoisonHit(this, x, y)
            case "true":
                //
                return
        }
    }

    createArenaTorches() {
        const centerX = this.camera.width / 2
        const centerY = this.camera.height / 2
        const arenaWidth = this.background.displayWidth
        const arenaHeight = this.background.displayHeight
        const offset = 83

        // Calculate corner positions
        const topLeft = {
            x: centerX - arenaWidth / 2 + offset, // Adjust offset as needed
            y: centerY - arenaHeight / 2 + offset + 17,
        }

        const topRight = {
            x: centerX + arenaWidth / 2 - offset,
            y: centerY - arenaHeight / 2 + offset + 17,
        }

        const bottomLeft = {
            x: centerX - arenaWidth / 2 + offset,
            y: centerY + arenaHeight / 2 - offset - 7,
        }

        const bottomRight = {
            x: centerX + arenaWidth / 2 - offset,
            y: centerY + arenaHeight / 2 - offset - 7,
        }

        this.fireEffects = this.add.group()

        // Add fire effects to corners
        this.fireEffects.add(new FireEffect(this, topLeft.x, topLeft.y))
        this.fireEffects.add(new FireEffect(this, topRight.x, topRight.y))
        this.fireEffects.add(new FireEffect(this, bottomLeft.x, bottomLeft.y))
        this.fireEffects.add(new FireEffect(this, bottomRight.x, bottomRight.y))
    }

    update(time: number, delta: number): void {
        if (this.state === "fighting") {
            if (this.anyTeamWiped()) {
                this.changeState("idle")
                this.finishRound()
            }
        }
    }
}
