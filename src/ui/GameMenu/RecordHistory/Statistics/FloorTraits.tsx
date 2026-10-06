import type { RecordRanking } from "../../../../game/systems/GameRecordStatistics"
import { RecordRankingChart } from "./RecordRankingChart"

export const FloorTraits = ({ entries, estimated }: { entries: RecordRanking[]; estimated: boolean }) => <RecordRankingChart title="Traits" entries={entries} estimated={estimated} />
