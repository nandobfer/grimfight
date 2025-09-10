// src/game/scenes/Game.ts

import { EventBus } from "../tools/EventBus"
import { Scene } from "phaser"
import { Grid } from "../tools/Grid"
import { CharacterRegistry } from "../creature/CharacterRegistry"
import { FireEffect } from "../fx/FireEffect"
import { generateEncounter } from "../tools/Encounter"
import { PlayerTeam } from "../creature/character/PlayerTeam"
import { Character, CharacterDto } from "../creature/character/Character"
import { DamageType } from "../ui/DamageNumbers"
import { ColdHit } from "../fx/ColdHit"
import { FireHit } from "../fx/FireHit"
import { Creature } from "../creature/Creature"
import { PoisonHit } from "../fx/PoisonHit"
import { AugmentsRegistry } from "../systems/Augment/AugmentsRegistry"
import { Augment } from "../systems/Augment/Augment"
import { LightningHit } from "../fx/LightningHit"
import { GoldCoinFx } from "../fx/GoldExplosion"
import { Shopkeeper } from "../systems/Shopkeeper"
import { EnemyTeam } from "../creature/monsters/EnemyTeam"
import { GameRecord } from "../systems/GameRecord"
import { ItemRegistry } from "../systems/Items/ItemRegistry"
import { Item } from "../systems/Items/Item"

export type GameState = "fighting" | "idle"

export interface GameProgressDto {
    playerLives: number
    playerGold: number
    floor: number
    version?: string
    playerAugments: Augment[]
    enemyAugments: Augment[]
    availableItems: string[]
    record?: GameRecord
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
    playerTeam: PlayerTeam
    enemyTeam: EnemyTeam
    state: GameState = "idle"
    walls: Phaser.GameObjects.Group
    floor = 1
    grid: Grid
    private fireEffects: Phaser.GameObjects.Group
    goldCoinFx: GoldCoinFx
    shopkeeper: Shopkeeper
    currentRecord: GameRecord
    availableItems = new Set<Item>()

    playerGold = starting_player_gold
    playerLives = starting_player_lives
    max_characters_in_board = max_characters_in_board
    max_bench_size = max_bench_size

    private uiGhost?: Character
    private dragFromBoard = new Map<string, Character>()

    perRoundFx: Phaser.GameObjects.Group

    constructor() {
        super("Game")
    }

    create() {
        this.physics.world.createDebugGraphic()
        this.physics.world.debugGraphic.visible = false
        this.camera = this.cameras.main

        this.createBackground()
        this.perRoundFx = this.add.group()
        this.grid = new Grid(this, this.background)
        this.goldCoinFx = new GoldCoinFx(this)
        this.playerTeam = new PlayerTeam(this, true)
        this.enemyTeam = new EnemyTeam(this, true)
        this.shopkeeper = new Shopkeeper(this)

        this.configurePhysics()
        this.createLight()

        this.enemyTeam.reset()

        this.loadProgress()
        this.loadPlayerCharacters()
        this.createArenaTorches()
        this.buildFloor()

        this.input.keyboard?.on("keydown-D", () => {
            const currentlyDebugging = this.physics.world.debugGraphic.visible
            this.physics.world.debugGraphic.visible = !currentlyDebugging
            console.log(`Physics debug: ${!currentlyDebugging}`)
        })

        this.input.keyboard?.on("keydown-SPACE", () => {
            if (this.state === "idle") {
                this.startRound()
            }
        })

        this.input.keyboard?.on("keydown-ESC", () => {
            this.game.pause()
            EventBus.emit("open-menu")
        })

        EventBus.emit("game-ready", this)
        EventBus.on("get-progress", () => this.emitProgress())
        EventBus.on("ui-augment", () => this.handleAugmentsFloor())
        EventBus.on("unpause", () => this.game.resume())
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
                this.playerTeam.saveAndEmit()
                this.playerTeam.bench.remove(ghost.id)
            } else {
                ghost.destroy(true) // cancel: didn’t drop in a valid tile
            }
        })
    }

    private installBenchHoverBridge() {
        // Keep track of which character is being dragged
        EventBus.on("ph-drag-start", ({ id }: { id: string }) => {
            const character = this.playerTeam.getById(id)
            if (character) this.dragFromBoard.set(id, character)
        })

        // React will tell us when pointer enters/leaves the bench area
        EventBus.on("bench-hover-enter", ({ id }: { id: string }) => {
            const character = this.dragFromBoard.get(id)
            if (!character) return
            character.setVisible(false)
            character.body.enable = false
            // (Optional) add a subtle marker in-world if you want
        })

        EventBus.on("bench-hover-leave", ({ id }: { id: string }) => {
            const character = this.dragFromBoard.get(id)
            if (!character) return
            character.setVisible(true)
            character.body.enable = true
        })

        // Commit: destroy in-world and add to bench
        EventBus.on("bench-drop", ({ id, dto }: { id: string; dto: CharacterDto }) => {
            const character = this.dragFromBoard.get(id)
            if (!character) return
            character.dropToBench = true // tells dragend to skip snapping logic
            character.items.forEach((item) => item.dropOnBoard())
            character.destroy(true)
            this.playerTeam.bench.add(dto) // your Bench.add will emit to UI
            this.dragFromBoard.delete(id)
            this.playerTeam.resetTraits()
            // this.playerTeam.refreshAllStats()
            this.playerTeam.saveAndEmit()
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
        this.events.emit("gamestate", this.state)
        EventBus.emit("gamestate", this.state)
    }

    startRound() {
        this.enemyTeam.reset()
        this.playerTeam.reset()
        this.playerTeam.damageChart.reset()
        this.changeState("fighting")
    }

    finishRound() {
        this.playerTeam.reset()
    }

    spawnItem(key: string, silent = false) {
        const item = ItemRegistry.create(key, this)
        this.availableItems.add(item)
        item.dropOnBoard()

        if (!silent) {
            this.saveProgress()
        }
    }

    spawnItems(quantity: number, silent = false) {
        for (let count = 1; count <= quantity; count++) {
            const item = ItemRegistry.randomComponent(this)
            this.availableItems.add(item)
            item.dropOnBoard()

            if (!silent) {
                this.saveProgress()
            }
        }
    }

    handleLootReward() {
        if (this.floor === 1) {
            this.spawnItems(3, true)
            return
        }

        if (this.floor % 10 === 0) {
            this.spawnItems(1, true)
        }

        for (let count = 1; count <= 3; count++) {
            const result = Phaser.Math.RND.between(1, 100)
            if (result <= 3) {
                this.spawnItems(1, true)
            }
        }
    }

    onFloorDefeated() {
        const goldGained = this.playerTeam.grantFloorReward(this.floor)
        this.goldCoinFx.explodeCameraCenterToCounter(goldGained)

        this.handleLootReward()

        this.floor += 1
        this.clearFloor()
        this.buildFloor()
        EventBus.emit("floor-change", this.floor)
        this.saveProgress()
    }

    clearFloor() {
        this.enemyTeam.clear(true, true)
        this.perRoundFx.clear(true, true)
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
        this.changeState("idle") // wait for player to start
        this.enemyTeam.reset()
        this.playerTeam.reset()
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

    gameOver(saveRecord = true) {
        if (saveRecord) {
            this.saveRecord()
        }

        this.resetProgress()
        this.clearFloor()
        this.buildFloor()
        this.playerTeam.bench.clear()
        this.playerTeam.store.shuffle()

        EventBus.emit("gameover")
        this.events.emit("gameover")
    }

    saveRecord() {
        const progress = this.getProgress()
        this.currentRecord = this.getCurrentRecord(progress)
        this.currentRecord.finishedAt = Date.now()

        const records = this.getSavedGameRecords()
        records.push(this.currentRecord)
        try {
            localStorage.setItem("gamerecords", JSON.stringify(records))
        } catch (error) {
            console.log(error)
        }
    }

    getSavedGameRecords() {
        try {
            const data = localStorage.getItem("gamerecords")
            if (data) {
                return JSON.parse(data) as GameRecord[]
            }
        } catch (error) {
            console.log(error)
        }
        return []
    }

    resetProgress() {
        this.floor = 1
        this.playerLives = starting_player_lives
        this.playerGold = starting_player_gold
        for (const item of this.availableItems) {
            item.sprite.destroy(true)
        }
        this.availableItems.clear()
        this.resetAugments()
        this.saveProgress()
        this.savePlayerCharacters([])
        this.loadPlayerCharacters()
        this.emitProgress()
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
                this.playerTeam.add(character)
                character.loadFromDto(dto)
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
        console.log(data)
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
            availableItems: Array.from(this.availableItems.values()).map((item) => item.key),
        }
        progress.record = this.getCurrentRecord(progress)
        return progress
    }

    getCurrentRecord(progress: GameProgressDto) {
        const characters = this.getSavedCharacters()
        const record: GameRecord = {
            augments: progress.playerAugments,
            comp: characters,
            finishedAt: 0,
            floor: progress.floor,
        }
        return record
    }

    loadProgress() {
        try {
            const data = localStorage.getItem("progress")
            if (data) {
                const progress = JSON.parse(data) as GameProgressDto
                console.log({ progress })

                this.floor = progress.floor
                this.playerGold = progress.playerGold
                this.playerLives = progress.playerLives
                this.currentRecord = progress.record || this.getCurrentRecord(progress)
                progress.availableItems.forEach((item) => this.availableItems.add(ItemRegistry.create(item, this)))
                progress.playerAugments.forEach((aug) => this.playerTeam.augments.add(AugmentsRegistry.create(aug.name, aug)))
                progress.enemyAugments.forEach((aug) => this.enemyTeam.augments.add(AugmentsRegistry.create(aug.name, aug)))
                console.log(progress.availableItems)
                this.availableItems.forEach((item) => item.dropOnBoard())
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
