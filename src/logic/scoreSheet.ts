import { type Category, type DiceRoll, UPPER_CATEGORIES, calculateScore } from './categories'

export type CategoryScores = Partial<Record<Category, number>>

export type UpperBonusStatus = {
  earned: boolean
  upperSubtotal: number
  remaining: number // 63に届くまでの残り点数(達成済みなら0)
}

export type ScoreSheet = {
  scores: CategoryScores
  upperBonus: UpperBonusStatus
  grandTotal: number
}

export const UPPER_BONUS_THRESHOLD = 63
export const UPPER_BONUS_SCORE = 35

function calculateUpperBonus(scores: CategoryScores): UpperBonusStatus {
  const upperSubtotal = UPPER_CATEGORIES.reduce((total, category) => total + (scores[category] ?? 0), 0)
  const earned = upperSubtotal >= UPPER_BONUS_THRESHOLD
  return {
    earned,
    upperSubtotal,
    remaining: earned ? 0 : UPPER_BONUS_THRESHOLD - upperSubtotal,
  }
}

function calculateGrandTotal(scores: CategoryScores, upperBonus: UpperBonusStatus): number {
  const scoresTotal = Object.values(scores).reduce((total: number, score) => total + score, 0)
  return scoresTotal + (upperBonus.earned ? UPPER_BONUS_SCORE : 0)
}

export function createEmptyScoreSheet(): ScoreSheet {
  const upperBonus = calculateUpperBonus({})
  return {
    scores: {},
    upperBonus,
    grandTotal: calculateGrandTotal({}, upperBonus),
  }
}

export function confirmCategory(sheet: ScoreSheet, category: Category, dice: DiceRoll): ScoreSheet {
  if (category in sheet.scores) {
    throw new Error(`category "${category}" is already confirmed`)
  }

  const scores: CategoryScores = { ...sheet.scores, [category]: calculateScore(category, dice) }
  const upperBonus = calculateUpperBonus(scores)

  return {
    scores,
    upperBonus,
    grandTotal: calculateGrandTotal(scores, upperBonus),
  }
}
