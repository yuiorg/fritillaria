import { describe, expect, it } from 'vitest'
import { confirmCategory, createEmptyScoreSheet, UPPER_BONUS_SCORE, UPPER_BONUS_THRESHOLD } from './scoreSheet'
import type { ScoreSheet } from './scoreSheet'
import type { DiceRoll } from './categories'

function createEmptySheet(): ScoreSheet {
  return {
    scores: {},
    upperBonus: {
      earned: false,
      upperSubtotal: 0,
      remaining: UPPER_BONUS_THRESHOLD,
    },
    grandTotal: 0,
  }
}

describe('createEmptyScoreSheet', () => {
  it('全役未確定・ボーナス未達成の初期状態を返す', () => {
    expect(createEmptyScoreSheet()).toEqual({
      scores: {},
      upperBonus: { earned: false, upperSubtotal: 0, remaining: UPPER_BONUS_THRESHOLD },
      grandTotal: 0,
    })
  })
})

describe('Upper Sectionボーナスの定数', () => {
  it('閾値は63点', () => {
    expect(UPPER_BONUS_THRESHOLD).toBe(63)
  })

  it('ボーナス点は35点', () => {
    expect(UPPER_BONUS_SCORE).toBe(35)
  })
})

describe('confirmCategory: 不変更新', () => {
  it('元のScoreSheetを書き換えず、新しいオブジェクトを返す', () => {
    const sheet = createEmptySheet()
    const dice: DiceRoll = [1, 1, 1, 2, 3]

    const next = confirmCategory(sheet, 'ones', dice)

    expect(next).not.toBe(sheet)
    expect(sheet.scores).toEqual({})
    expect(sheet.grandTotal).toBe(0)
  })

  it('scoresも新しいオブジェクトになり、元のsheet.scoresを直接書き換えない', () => {
    const sheet = createEmptySheet()
    const dice: DiceRoll = [1, 1, 1, 2, 3]

    const next = confirmCategory(sheet, 'ones', dice)

    expect(next.scores).not.toBe(sheet.scores)
    expect(sheet.scores.ones).toBeUndefined()
  })

  it('確定したcategoryのスコアがdiceから計算されて反映される', () => {
    const sheet = createEmptySheet()
    const dice: DiceRoll = [3, 3, 3, 3, 3]

    const next = confirmCategory(sheet, 'yacht', dice)

    expect(next.scores.yacht).toBe(50)
  })
})

describe('confirmCategory: 確定済みcategoryへの再確定', () => {
  it('既に確定済みのcategoryを再度確定しようとすると例外を投げる', () => {
    const sheet = createEmptySheet()
    const dice: DiceRoll = [1, 1, 1, 2, 3]
    const confirmed = confirmCategory(sheet, 'ones', dice)

    expect(() => confirmCategory(confirmed, 'ones', dice)).toThrow()
  })

  it('再確定時のdiceが1回目と異なっていても例外を投げる', () => {
    const sheet = createEmptySheet()
    const confirmed = confirmCategory(sheet, 'choice', [1, 1, 1, 1, 1])

    expect(() => confirmCategory(confirmed, 'choice', [6, 6, 6, 6, 6])).toThrow()
  })

  it('0点で確定した場合も「未確定」とは区別され、再確定は例外になる', () => {
    const sheet = createEmptySheet()
    const dice: DiceRoll = [2, 3, 4, 5, 6] // 1を含まないためonesは0点になる
    const confirmed = confirmCategory(sheet, 'ones', dice)

    expect(confirmed.scores.ones).toBe(0)
    expect(() => confirmCategory(confirmed, 'ones', dice)).toThrow()
  })

  it('あるcategoryの確定済み状態は、別のcategoryの確定に影響しない', () => {
    const sheet = createEmptySheet()
    const afterOnes = confirmCategory(sheet, 'ones', [1, 1, 1, 2, 3])
    const afterTwos = confirmCategory(afterOnes, 'twos', [2, 2, 2, 3, 4])

    expect(afterTwos.scores.ones).toBe(3)
    expect(afterTwos.scores.twos).toBe(6)
    expect(() => confirmCategory(afterTwos, 'ones', [1, 1, 1, 2, 3])).toThrow()
  })
})

describe('confirmCategory: Upper Sectionボーナスの再計算', () => {
  it('Upper6役の確定済み合計が63点未満の場合はボーナス未達成', () => {
    let sheet = createEmptySheet()
    sheet = confirmCategory(sheet, 'ones', [1, 1, 3, 4, 5]) // 2点
    sheet = confirmCategory(sheet, 'twos', [2, 2, 3, 4, 5]) // 4点
    sheet = confirmCategory(sheet, 'threes', [3, 1, 2, 4, 5]) // 3点
    sheet = confirmCategory(sheet, 'fours', [4, 4, 1, 2, 3]) // 8点
    sheet = confirmCategory(sheet, 'fives', [5, 1, 2, 3, 4]) // 5点
    sheet = confirmCategory(sheet, 'sixes', [6, 1, 2, 3, 4]) // 6点
    // 上6役の合計 = 2+4+3+8+5+6 = 28

    expect(sheet.upperBonus.upperSubtotal).toBe(28)
    expect(sheet.upperBonus.earned).toBe(false)
    expect(sheet.upperBonus.remaining).toBe(63 - 28)
  })

  it('Upper6役の確定済み合計が63点以上になるとボーナス達成、remainingは0', () => {
    let sheet = createEmptySheet()
    sheet = confirmCategory(sheet, 'ones', [1, 1, 1, 5, 6]) // 3点
    sheet = confirmCategory(sheet, 'twos', [2, 2, 2, 5, 6]) // 6点
    sheet = confirmCategory(sheet, 'threes', [3, 3, 3, 5, 6]) // 9点
    sheet = confirmCategory(sheet, 'fours', [4, 4, 4, 4, 6]) // 16点
    sheet = confirmCategory(sheet, 'fives', [5, 5, 5, 5, 6]) // 20点
    sheet = confirmCategory(sheet, 'sixes', [6, 6, 1, 2, 3]) // 12点
    // 上6役の合計 = 3+6+9+16+20+12 = 66

    expect(sheet.upperBonus.upperSubtotal).toBe(66)
    expect(sheet.upperBonus.earned).toBe(true)
    expect(sheet.upperBonus.remaining).toBe(0)
  })

  it('Upper6役が全て確定していなくても、確定済み分の合計が63点以上になった時点で達成扱いになる', () => {
    let sheet = createEmptySheet()
    sheet = confirmCategory(sheet, 'sixes', [6, 6, 6, 6, 6]) // 30点
    sheet = confirmCategory(sheet, 'fives', [5, 5, 5, 5, 5]) // 25点
    // ここまでの合計は55点でまだ63点未満
    expect(sheet.upperBonus.earned).toBe(false)
    expect(sheet.upperBonus.remaining).toBe(63 - 55)

    sheet = confirmCategory(sheet, 'fours', [4, 4, 4, 1, 1]) // 12点
    // 合計 = 55 + 12 = 67

    expect(sheet.upperBonus.upperSubtotal).toBe(67)
    expect(sheet.upperBonus.earned).toBe(true)
    expect(sheet.upperBonus.remaining).toBe(0)
  })

  it('Lower Sectionの役を確定してもupperSubtotalには影響しない', () => {
    let sheet = createEmptySheet()
    sheet = confirmCategory(sheet, 'yacht', [6, 6, 6, 6, 6]) // 50点(Lower Section)

    expect(sheet.upperBonus.upperSubtotal).toBe(0)
    expect(sheet.upperBonus.earned).toBe(false)
    expect(sheet.upperBonus.remaining).toBe(63)
  })
})

describe('confirmCategory: grandTotalの再計算', () => {
  it('ボーナス未達成の場合、grandTotalは確定済みスコアの合計のみ', () => {
    let sheet = createEmptySheet()
    sheet = confirmCategory(sheet, 'ones', [1, 1, 3, 4, 5]) // 2点
    sheet = confirmCategory(sheet, 'choice', [1, 2, 3, 4, 5]) // 15点

    expect(sheet.upperBonus.earned).toBe(false)
    expect(sheet.grandTotal).toBe(2 + 15)
  })

  it('ボーナス達成の場合、grandTotalにUPPER_BONUS_SCORE(35点)が加算される', () => {
    let sheet = createEmptySheet()
    sheet = confirmCategory(sheet, 'ones', [1, 1, 1, 5, 6]) // 3点
    sheet = confirmCategory(sheet, 'twos', [2, 2, 2, 5, 6]) // 6点
    sheet = confirmCategory(sheet, 'threes', [3, 3, 3, 5, 6]) // 9点
    sheet = confirmCategory(sheet, 'fours', [4, 4, 4, 4, 6]) // 16点
    sheet = confirmCategory(sheet, 'fives', [5, 5, 5, 5, 6]) // 20点
    sheet = confirmCategory(sheet, 'sixes', [6, 6, 1, 2, 3]) // 12点
    sheet = confirmCategory(sheet, 'fourOfAKind', [4, 4, 4, 4, 6]) // 22点
    sheet = confirmCategory(sheet, 'fullHouse', [2, 2, 2, 5, 5]) // 25点
    sheet = confirmCategory(sheet, 'smallStraight', [1, 2, 3, 4, 6]) // 30点
    sheet = confirmCategory(sheet, 'largeStraight', [2, 3, 4, 5, 6]) // 40点
    sheet = confirmCategory(sheet, 'yacht', [3, 3, 3, 3, 3]) // 50点
    sheet = confirmCategory(sheet, 'choice', [6, 6, 6, 5, 1]) // 24点

    const upperSubtotal = 3 + 6 + 9 + 16 + 20 + 12 // 66点(design/4/result-screen-pc.html の「ボーナス達成」シナリオと同一の内訳)
    const lowerSubtotal = 22 + 25 + 30 + 40 + 50 + 24 // 191点(同上)

    expect(sheet.upperBonus.earned).toBe(true)
    expect(sheet.upperBonus.remaining).toBe(0)
    expect(sheet.grandTotal).toBe(upperSubtotal + UPPER_BONUS_SCORE + lowerSubtotal)
    expect(sheet.grandTotal).toBe(292)
  })
})
