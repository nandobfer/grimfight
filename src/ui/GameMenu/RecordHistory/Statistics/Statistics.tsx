import { Box, Typography } from "@mui/material"
import type { GameRecordStatistics } from "../../../../game/systems/GameRecordStatistics"
import { FloorTimestamp } from "./FloorTimestamp"
import { FloorCharacters } from "./FloorCharacters"
import { FloorTraits } from "./FloorTraits"

export const Statistics = ({ statistics }: { statistics: GameRecordStatistics }) => (
    <Box sx={{ flexDirection: "column", gap: 2, width: 1, minWidth: 0 }}>
        {statistics.records.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>As estatísticas aparecerão após encerrar sua primeira run.</Typography> : <>
            <FloorTimestamp days={statistics.days} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, minWidth: 0 }}>
                <FloorCharacters entries={statistics.characters} />
                <FloorTraits entries={statistics.traits} estimated={statistics.estimatedTraits} />
            </Box>
        </>}
    </Box>
)
