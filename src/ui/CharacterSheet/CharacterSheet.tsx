import React, { useEffect, useMemo, useRef, useState } from "react"
import { Accordion, AccordionDetails, AccordionSummary, Badge, Box, Button, LinearProgress, Typography, useMediaQuery } from "@mui/material"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterAvatar } from "./CharacterAvatar"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { AbilityTooltip } from "./AbilityTooltip"
import { Character } from "../../game/creature/character/Character"

interface CharacterSheetProps {
    character: Character
    store: CharacterStore
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
            { title: "Mana Regen", value: `${charRef.current.manaPerSecond} /s` }, // rarely changes
            { title: "Mana /hit", value: `${charRef.current.manaPerAttack}` },
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

    const sell = () => props.store.sell(character.id)
    return (
        <Accordion sx={{ flexDirection: "column" }} slots={{ root: Box }}>
            <AccordionSummary sx={{ padding: 0, marginTop: -1.5, marginBottom: -0.5 }}>
                <AbilityTooltip description={character.abilityDescription} placement="auto">
                    <Button variant="outlined" fullWidth sx={{ justifyContent: "start", padding: 1, gap: 1, alignItems: "center" }}>
                        <Badge
                            badgeContent={`${character.level}`}
                            slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
                        >
                            <CharacterAvatar name={character.name} size={30} />
                        </Badge>
                        <Box sx={{ flexDirection: "column", flex: 1, alignItems: "start" }}>
                            <Typography variant="subtitle2">{character.name}</Typography>
                            <LinearProgress
                                variant="determinate"
                                value={characterHealthPercent}
                                sx={{ width: 1, height: 7 }}
                                color={characterHealthPercent > 45 ? "success" : characterHealthPercent > 20 ? "warning" : "error"}
                            />
                        </Box>
                    </Button>
                </AbilityTooltip>
            </AccordionSummary>
            <AccordionDetails sx={{ marginTop: -1.5, marginBottom: -0.5 }}>
                <Box sx={{ flexDirection: "column" }}>
                    {attributes.map((data) => (
                        <SheetData key={data.title} title={data.title} value={data.value} />
                    ))}
                    <Button color="warning" onClick={sell}>
                        Sell: {props.store.getCost(character.level)} g
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    )
}
