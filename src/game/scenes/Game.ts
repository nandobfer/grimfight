// src/game/scenes/Game.ts

import { EventBus } from "../tools/EventBus"
import { Scene } from "phaser"
import { Grid } from "../tools/Grid"
import { CharacterRegistry } from "../creature/CharacterRegistry"
import { FireEffect } from "../fx/FireEffect"
import { generateEncounter } from "../tools/Encounter"
import { MonsterGroup } from "../creature/monsters/MonsterGroup"
import { CharacterGroup } from "../creature/character/CharacterGroup"
import { CharacterDto } from "../creature/character/Character"
import { DamageType } from "../ui/DamageNumbers"
import { spawnParrySpark } from "../fx/Parry"
import { ColdHit } from "../fx/ColdHit"
import { FireHit } from "../fx/FireHit"
import { burstBlood } from "../fx/Blood"
import { Creature } from "../creature/Creature"
import { PoisonHit } from "../fx/PoisonHit"

export type GameState = "fighting" | "idle"

export interface GameProgressDto {
    playerLives: number
    playerGold: number
    floor: number
    version?: string
}

const starting_player_lives = 3
const starting_player_gold = 1
const max_characters_in_board = 6

export class Game extends Scene {
    version = "v1.0.3"
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

    playerGold = starting_player_gold
    playerLives = starting_player_lives
    max_characters_in_board = max_characters_in_board

    constructor() {
        super("Game")
    }

    create() {
        this.physics.world.createDebugGraphic()
        this.physics.world.debugGraphic.visible = false
        this.camera = this.cameras.main

        this.createBackground()
        this.grid = new Grid(this, this.background)

        this.playerTeam = new CharacterGroup(this, [], { isPlayer: true })
        this.enemyTeam = new MonsterGroup(this, [])

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

    changeScene() {
        this.scene.start("GameOver")
    }

    changeState(state: GameState) {
        this.state = state
        EventBus.emit("gamestate", this.state)
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
        this.playerTeam.grantFloorReward(this.floor)
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

        this.resetFloor()
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
        this.playerTeam.store.shuffle()

        EventBus.emit("gameover")
    }

    resetProgress() {
        this.floor = 1
        this.playerLives = starting_player_lives
        this.playerGold = starting_player_gold
        this.saveProgress()
        this.emitProgress()
        this.savePlayerCharacters([])
        this.loadPlayerCharacters()
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
        }
        return progress
    }

    loadProgress() {
        try {
            const data = localStorage.getItem("progress")
            if (data) {
                const progress = JSON.parse(data) as GameProgressDto
                this.floor = progress.floor
                this.playerGold = progress.playerGold
                this.playerLives = progress.playerLives

                if (this.version !== progress.version) {
                    this.gameOver()
                }
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
            case "block":
                return spawnParrySpark(this, x, y)
            case "cold":
                return new ColdHit(this, x, y)
            case "fire":
                return new FireHit(this, x, y)
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
