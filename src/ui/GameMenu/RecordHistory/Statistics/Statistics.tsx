import React from "react"
import { Box, Typography, useTheme } from "@mui/material"
import { GameRecord } from "../../../../game/systems/GameRecord"
import { FloorTimestamp } from "./FloorTimestamp"
import { FloorCharacters } from "./FloorCharacters"
import { FloorTraits } from "./FloorTraits"

interface StatisticsProps {
    records: GameRecord[]
}

export const Statistics: React.FC<StatisticsProps> = (props) => {
    const theme = useTheme()

    return (
        <Box sx={{ flexDirection: "column", gap: 1, width: 1000 }}>
            <Typography>best results</Typography>
            <Box sx={{ flexDirection: "row", gap: 1 }}>
                <FloorTimestamp records={props.records} y="floor" color={theme.palette.primary.main} />
                <FloorCharacters records={props.records} y="floor" color={theme.palette.primary.main} />
                <FloorTraits records={props.records} y="floor" color={theme.palette.primary.main} />
            </Box>
            <Typography>total games</Typography>
            <Box sx={{ flexDirection: "row", gap: 1 }}>
                <FloorTimestamp records={props.records} y="count" color={theme.palette.info.main} />
                <FloorCharacters records={props.records} y="count" color={theme.palette.info.main} />
                <FloorTraits records={props.records} y="count" color={theme.palette.info.main} />
            </Box>
        </Box>
    )
}
