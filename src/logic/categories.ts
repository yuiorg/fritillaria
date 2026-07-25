// 乱数生成・キープ/振り直しの状態管理はゲーム進行(UI)側の責務とし、
// ロジック層は確定した5つの目の組み合わせを入力として受け取るだけにする
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

export type DiceRoll = readonly [DiceValue, DiceValue, DiceValue, DiceValue, DiceValue]

export type UpperCategory = 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'

export type LowerCategory =
  | 'fourOfAKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'yacht'
  | 'choice'

export type Category = UpperCategory | LowerCategory

export const UPPER_CATEGORIES: readonly UpperCategory[] = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
]

export const LOWER_CATEGORIES: readonly LowerCategory[] = [
  'fourOfAKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'yacht',
  'choice',
]

export const CATEGORIES: readonly Category[] = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES]

const UPPER_TARGET_VALUE: Record<UpperCategory, DiceValue> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
}

function sumAll(dice: DiceRoll): number {
  return dice.reduce((total, value) => total + value, 0)
}

function sumOf(dice: DiceRoll, target: DiceValue): number {
  return dice.filter((value) => value === target).reduce((total, value) => total + value, 0)
}

function countByValue(dice: DiceRoll): Map<DiceValue, number> {
  const counts = new Map<DiceValue, number>()
  for (const value of dice) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return counts
}

function hasCountOfAny(dice: DiceRoll, count: number): boolean {
  return [...countByValue(dice).values()].some((n) => n >= count)
}

function isFullHouse(dice: DiceRoll): boolean {
  const counts = [...countByValue(dice).values()].sort()
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3
}

function includesConsecutiveRun(dice: DiceRoll, length: number): boolean {
  const uniqueValues = new Set(dice)
  let run = 0
  for (let value = 1; value <= 6; value += 1) {
    run = uniqueValues.has(value as DiceValue) ? run + 1 : 0
    if (run >= length) return true
  }
  return false
}

function isSmallStraight(dice: DiceRoll): boolean {
  return includesConsecutiveRun(dice, 4)
}

function isLargeStraight(dice: DiceRoll): boolean {
  return includesConsecutiveRun(dice, 5)
}

function isYacht(dice: DiceRoll): boolean {
  return hasCountOfAny(dice, 5)
}

type CategoryScorer = (dice: DiceRoll) => number

const scorers: Record<Category, CategoryScorer> = {
  ones: (dice) => sumOf(dice, UPPER_TARGET_VALUE.ones),
  twos: (dice) => sumOf(dice, UPPER_TARGET_VALUE.twos),
  threes: (dice) => sumOf(dice, UPPER_TARGET_VALUE.threes),
  fours: (dice) => sumOf(dice, UPPER_TARGET_VALUE.fours),
  fives: (dice) => sumOf(dice, UPPER_TARGET_VALUE.fives),
  sixes: (dice) => sumOf(dice, UPPER_TARGET_VALUE.sixes),
  fourOfAKind: (dice) => (hasCountOfAny(dice, 4) ? sumAll(dice) : 0),
  fullHouse: (dice) => (isFullHouse(dice) ? 25 : 0),
  smallStraight: (dice) => (isSmallStraight(dice) ? 30 : 0),
  largeStraight: (dice) => (isLargeStraight(dice) ? 40 : 0),
  yacht: (dice) => (isYacht(dice) ? 50 : 0),
  choice: (dice) => sumAll(dice),
}

export function calculateScore(category: Category, dice: DiceRoll): number {
  return scorers[category](dice)
}
