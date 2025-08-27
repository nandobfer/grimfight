import React, { useEffect, useMemo, useRef, useState } from "react"
import { Badge, Box, Button, ClickAwayListener, Drawer, LinearProgress, Tooltip, Typography, useMediaQuery } from "@mui/material"
import { CharacterAvatar } from "./CharacterAvatar"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { AbilityTooltip } from "./AbilityTooltip"
import { Character } from "../../game/creature/character/Character"
import { GoldCoin } from "../components/GoldCoin"

interface CharacterSheetProps {
    character: Character
    store: CharacterStore
    sell: (id: string) => void
}

export interface SheetDataItem {
    title: string
    value: number | string
}

export const SheetData: React.FC<SheetDataItem> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    return (
        <Box sx={{ gap: 1, alignItems: "center" }}>
            <Typography fontWeight={"bold"} variant="caption" fontSize={isMobile ? 8 : undefined}>
                {props.title}:
            </Typography>
            <Typography variant="caption">{props.value}</Typography>
        </Box>
    )
}

type Snap = {
    level: number
    name: string
    health: number
    maxHealth: number
    mana: number
    maxMana: number
    abilityPower: number
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

    const attributes: SheetDataItem[] = useMemo(
        () => [
            { title: "Health", value: `${snap.health} / ${snap.maxHealth}` },
            { title: "Mana", value: `${snap.mana} / ${snap.maxMana}` },
            { title: "Mana Regen", value: `${Math.round(charRef.current.manaPerSecond)} /s` }, // rarely changes
            { title: "Mana /hit", value: `${Math.round(charRef.current.manaPerAttack)}` },
            { title: "Ability Power", value: `${snap.abilityPower}` },
            { title: "Attack Damage", value: `${snap.adMin} - ${snap.adMax}` },
            { title: "Attack Speed", value: `${snap.attackSpeed} /s` },
            { title: "Attack Range", value: `${snap.attackRange}` },
            { title: "Crit Chance", value: `${snap.critChance} %` },
            { title: "Crit Damage Multiplier", value: `x ${snap.critDamageMultiplier}` },
            { title: "Life Steal", value: `${character.lifesteal} %` },
            { title: "Armor", value: snap.armor },
            { title: "Resistance", value: snap.resistance },
            { title: "Movement Speed", value: snap.speed },
        ],
        [snap]
    )

    const characterHealthPercent = useMemo(() => (snap.maxHealth > 0 ? (snap.health / snap.maxHealth) * 100 : 0), [snap.health, snap.maxHealth])
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(snap.level)), [snap.level])

    return (
        <AbilityTooltip description={character.abilityDescription} placement="auto">
            <>
                <Box sx={{ width: 1, gap: 1 }}>
                    <Badge
                        badgeContent={`${character.level}`}
                        slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
                    >
                        <CharacterAvatar name={character.name} size={30} />
                    </Badge>
                    <Box sx={{ flexDirection: "column", flex: 1, alignItems: "start" }}>
                        <Box sx={{ justifyContent: "space-between", width: 1 }}>
                            <Typography variant="subtitle2">{character.name}</Typography>
                            <Tooltip title="click to sell character">
                                <Button color="warning" onClick={() => props.sell(character.id)} size="small" sx={{ padding: 0, minWidth: 0 }}>
                                    <GoldCoin quantity={props.store.getCost(character.level)} fontSize={10} size={10} />
                                </Button>
                            </Tooltip>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={characterHealthPercent}
                            sx={{ width: 1, height: 7 }}
                            color={characterHealthPercent > 45 ? "success" : characterHealthPercent > 20 ? "warning" : "error"}
                        />
                    </Box>
                </Box>
                <Box sx={{ flexDirection: "column", width: 1, color: "secondary.main" }}>
                    {attributes.map((data) => (
                        <SheetData key={data.title} title={data.title} value={data.value} />
                    ))}
                </Box>
            </>
        </AbilityTooltip>
    )
}
