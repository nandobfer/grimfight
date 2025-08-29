// TraitDescriptionHelpers.tsx
import React from "react"
import { Typography } from "@mui/material"
import { Trait } from "./Trait"

/** Build "(tier1 / tier2 / ...)" groups, coloring the active tier. */
export function buildTierGroups(trait: Trait) {
  const ordered = [...trait.stages.entries()].sort(([a], [b]) => a - b)
  const stageKeys = ordered.map(([k]) => k)
  const activeIdx = stageKeys.indexOf(trait.activeStage) // -1 if none active

  const stageParams = ordered
    .map(([, v]) => (v as any)?.descriptionParams as (string | number)[] | undefined)
    .filter(Boolean) as (string | number)[][]

  const maxLen = stageParams.reduce((m, a) => Math.max(m, a.length), 0)

  const groups: React.ReactNode[] = []
  for (let paramIdx = 0; paramIdx < maxLen; paramIdx++) {
    const col = stageParams.map(arr => arr[paramIdx]).filter(v => v != null).map(String)

    if (!col.length) continue

    groups.push(
      <Typography
        key={`grp-${paramIdx}`}
        component="span"
        sx={{ fontWeight: 700, fontSize: "inherit" }}
      >
        {"("}
        {col.map((val, i) => (
          <React.Fragment key={`v-${paramIdx}-${i}`}>
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                fontSize: "inherit",
                color: i === activeIdx && activeIdx !== -1 ? "primary.main" : "inherit",
              }}
            >
              {val}
            </Typography>
            {i < col.length - 1 ? " / " : ""}
          </React.Fragment>
        ))}
        {")"}
      </Typography>
    )
  }
  return groups
}

/** Replace {0},{1},… with groups. If no placeholders, append groups. */
export function renderTraitDescription(trait: Trait) {
  const groups = buildTierGroups(trait)
  const regex = /\{(\d+)\}/g
  const hasPlaceholders = regex.test(trait.description)
  regex.lastIndex = 0

  if (hasPlaceholders) {
    const parts: React.ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    while ((m = regex.exec(trait.description))) {
      const [full, idxStr] = m
      const idx = Number(idxStr)
      if (m.index > last) parts.push(trait.description.slice(last, m.index))
      parts.push(groups[idx] ?? "")
      last = m.index + full.length
    }
    if (last < trait.description.length) parts.push(trait.description.slice(last))
    return parts
  }

  return (
    <>
      {trait.description}{" "}
      {groups.map((g, i) => (
        <React.Fragment key={`tail-${i}`}>
          {g}
          {i < groups.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </>
  )
}
