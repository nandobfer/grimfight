export const minimum_characters_in_board = 1
export const board_limit_level_bonus = 3
export const maximum_characters_in_board = 10

export function calculateMaxCharactersInBoard(highestCharacterLevel: number) {
    if (highestCharacterLevel < 1) return minimum_characters_in_board

    const rawLimit = Math.floor(highestCharacterLevel) + board_limit_level_bonus
    return Math.min(maximum_characters_in_board, Math.max(minimum_characters_in_board, rawLimit))
}
