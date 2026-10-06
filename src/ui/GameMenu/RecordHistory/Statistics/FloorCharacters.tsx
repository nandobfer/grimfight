import type { RecordRanking } from "../../../../game/systems/GameRecordStatistics"
import { RecordRankingChart } from "./RecordRankingChart"

export const FloorCharacters = ({ entries }: { entries: RecordRanking[] }) => <RecordRankingChart title="Personagens" entries={entries} />
