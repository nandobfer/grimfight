import { describe, expect, it } from "vitest"
import {
    board_limit_level_bonus,
    calculateMaxCharactersInBoard,
    maximum_characters_in_board,
    minimum_characters_in_board,
} from "../../src/game/creature/character/boardLimit"

describe("board limit", () => {
    it("uses the absolute minimum when there is no character on the board", () => {
        expect(calculateMaxCharactersInBoard(0)).toBe(minimum_characters_in_board)
    })

    it("derives the board limit from the highest character level", () => {
        const highestLevel = 2

        expect(calculateMaxCharactersInBoard(highestLevel)).toBe(highestLevel + board_limit_level_bonus)
    })

    it("caps the board limit at the absolute maximum", () => {
        expect(calculateMaxCharactersInBoard(99)).toBe(maximum_characters_in_board)
    })
})
