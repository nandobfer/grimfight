import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    Badge,
    Box,
    Button,
    capitalize,
    ClickAwayListener,
    Divider,
    Drawer,
    IconButton,
    LinearProgress,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material"
import { CharacterAvatar } from "./CharacterAvatar"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { AbilityTooltip } from "./AbilityTooltip"
import { Character } from "../../game/creature/character/Character"
import { GoldCoin } from "../components/GoldCoin"
import { renderDescription } from "../../game/tools/TokenizedText"
import { Game } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"
import { Close } from "@mui/icons-material"

interface CharacterSheetProps {
    character: Character
    store: CharacterStore
    game: Game
    sell: (id: string) => void
}

export interface SheetDataItem {
    title: string
    value: number
    tooltip: string
    fixed?: number
    suffix?: string
}

export const SheetData: React.FC<SheetDataItem> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    return (
        <Tooltip title={props.tooltip}>
            <Box sx={{ gap: 1, alignItems: "center" }}>
                <Typography fontWeight={"bold"} variant="caption" fontSize={isMobile ? 8 : undefined}>
                    {props.title}:
                </Typography>
                <Typography variant="caption">
                    {props.fixed ? props.value.toFixed(props.fixed) : Math.round(props.value)} {props.suffix}
                </Typography>
            </Box>
        </Tooltip>
    )
}

export const StatGroup: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
    <Box sx={{ flexDirection: "column", color: `${color}.main` }}>{children}</Box>
)

type Snap = {
    level: number
    name: string
    health: number
    maxHealth: number
    mana: number
    maxMana: number
    abilityPower: number
    ad: number
    adMin: number
    adMax: number
    attackSpeed: number
    attackRange: number
    critChance: number
    critDamageMultiplier: number
    armor: number
    resistance: number
    speed: number
    lifesteal: number
}

const makeSnap = (c: Character): Snap => ({
    level: c.level,
    name: c.name,
    health: Math.round(c.health),
    maxHealth: Math.round(c.maxHealth),
    mana: Math.round(c.mana),
    maxMana: c.maxMana,
    abilityPower: Math.round(c.abilityPower),
    ad: Math.round(c.attackDamage),
    adMin: Math.round(c.attackDamage * c.minDamageMultiplier),
    adMax: Math.round(c.attackDamage * c.maxDamageMultiplier),
    attackSpeed: +c.attackSpeed.toFixed(2),
    attackRange: c.attackRange,
    critChance: c.critChance,
    critDamageMultiplier: c.critDamageMultiplier,
    lifesteal: c.lifesteal,
    armor: Math.round(c.armor),
    resistance: Math.round(c.resistance),
    speed: Math.round(c.speed),
})

const shallowEqual = (a: Snap, b: Snap) => {
    for (const k in a) if ((a as any)[k] !== (b as any)[k]) return false
    return true
}

export const CharacterSheet: React.FC<CharacterSheetProps> = (props) => {
    const character = props.character
    const isMobile = useMediaQuery("(orientation: portrait)")

    const charRef = useRef(character)
    useEffect(() => {
        charRef.current = character
    }, [character])
    // sample UI state at 10 FPS (adjust as you like)
    const [snap, setSnap] = useState(() => makeSnap(charRef.current))

    useEffect(() => {
        const id = setInterval(() => {
            const next = makeSnap(charRef.current)
            setSnap((prev) => (shallowEqual(prev, next) ? prev : next))
        }, 100)
        return () => clearInterval(id)
    }, [])

    const benchCharacter = () => {
        props.game.playerTeam.benchCharacter(charRef.current.id)
        EventBus.emit("open-store")
        EventBus.emit("select-char", null)
    }

    const characterHealthPercent = useMemo(() => (snap.maxHealth > 0 ? (snap.health / snap.maxHealth) * 100 : 0), [snap.health, snap.maxHealth])
    const characterManaPercent = useMemo(() => (snap.maxMana > 0 ? (snap.mana / snap.maxMana) * 100 : 0), [snap.mana, snap.maxMana])
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(snap.level)), [snap.level])

    return (
        <AbilityTooltip description={character.abilityDescription} placement="auto">
            <>
                <Box sx={{ width: 1, gap: 2, alignItems: "center", position: "relative" }}>
                    <Badge
                        badgeContent={`${character.level}`}
                        slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
                    >
                        <CharacterAvatar name={character.name} size={45} />
                    </Badge>
                    <Box sx={{ flexDirection: "column", flex: 1, alignItems: "start" }}>
                        <Box sx={{ justifyContent: "space-between", width: 1 }}>
                            <Typography variant="subtitle2">{capitalize(character.name)}</Typography>
                        </Box>
                        <Box sx={{ width: 1, position: "relative", justifyContent: "center", alignItems: "center" }}>
                            <LinearProgress
                                variant="determinate"
                                value={characterHealthPercent}
                                sx={{ width: 1, height: 14 }}
                                color={characterHealthPercent > 45 ? "success" : characterHealthPercent > 20 ? "warning" : "error"}
                            />
                            <Typography sx={{ position: "absolute", fontSize: 12, fontWeight: "bold" }}>
                                {snap.health} / {snap.maxHealth}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                width: 1,
                                position: "relative",
                                justifyContent: "center",
                                alignItems: "center",
                                visibility: snap.maxMana === 0 ? "hidden" : undefined,
                            }}
                        >
                            <LinearProgress variant="determinate" value={characterManaPercent} sx={{ width: 1, height: 14 }} color={"info"} />
                            <Typography sx={{ position: "absolute", fontSize: 12, fontWeight: "bold" }}>
                                {snap.mana} / {snap.maxMana}
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton sx={{ position: "absolute", top: -12, right: -12 }} onClick={() => EventBus.emit("select-char", null)} size="small">
                        <Close />
                    </IconButton>
                </Box>

                <Box sx={{ flexDirection: "column" }}>
                    <Typography fontWeight={"bold"} variant="subtitle2" color="primary.main" fontSize={isMobile ? 10 : undefined}>
                        {character.abilityName}:
                    </Typography>
                    <Typography variant="caption" sx={{ whiteSpace: "pre-wrap" }} fontSize={isMobile ? 8 : undefined}>
                        {renderDescription(character.getAbilityDescription())}
                    </Typography>
                </Box>

                {/* <Box sx={{ flexDirection: "column", width: 1, color: "secondary.main" }}>
                    {attributes.map((data) => (
                        <SheetData key={data.title} title={data.title} value={data.value} />
                    ))}
                </Box> */}
                <Box sx={{ justifyContent: "space-between" }}>
                    <StatGroup color="error">
                        <SheetData title={"AD"} value={snap.ad} tooltip="Dano médio de cada ataque básico" />
                        <SheetData title={"Crit"} value={snap.critChance} tooltip="Chance de acertar criticamente" suffix="%" />
                        <SheetData
                            title={"Crit Mult"}
                            value={snap.critDamageMultiplier}
                            tooltip="Multiplicador de dano crítico"
                            suffix="x"
                            fixed={2}
                        />
                    </StatGroup>
                    <Divider />
                    <StatGroup color="info">
                        <SheetData title={"AP"} value={snap.abilityPower} tooltip="Poder de habilidade com magias e feitiços" />
                        <SheetData title={"Mana"} value={charRef.current.manaPerSecond} tooltip="Mana regenerada a cada segundo" suffix="/s" />
                        <SheetData title={"MP /a"} value={charRef.current.manaPerAttack} tooltip="Mana ganha a cada ataque" />
                    </StatGroup>
                </Box>
                <Box sx={{ justifyContent: "space-between" }}>
                    <StatGroup color="warning">
                        <SheetData title={"AS"} value={snap.attackSpeed} tooltip="Velocidade de ataques a cada segundo" fixed={1} suffix="/s" />
                        <SheetData title={"Alcance"} value={snap.attackRange} tooltip="Alcance de ataque" />
                        <SheetData title={"Vel"} value={snap.speed} tooltip="Velocidade de movimento" />
                    </StatGroup>
                    <Divider />
                    <StatGroup color="success">
                        <SheetData title={"Armadura"} value={snap.armor} tooltip="Quantidade de dano reduzido a cada ataque recebido" />
                        <SheetData
                            title={"Resistência"}
                            value={snap.resistance}
                            tooltip="Porcentagem do dano reduzido a cada ataque recebido"
                            suffix="%"
                        />
                        <SheetData title={"Lifesteal"} value={snap.lifesteal} tooltip="Porcentagem do dano causado recuperado como vida" suffix="%" />
                    </StatGroup>
                </Box>
            </>
        </AbilityTooltip>
    )
}
