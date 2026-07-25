import { describe, expect, it } from 'vitest'
import { CATEGORIES, calculateScore } from './categories'
import type { Category, DiceRoll } from './categories'

type Case = { title: string; category: Category; dice: DiceRoll; expected: number }

describe('calculateScore', () => {
  it('12役すべてに対応する判定関数を持つ', () => {
    const expectedCategories: Category[] = [
      'ones',
      'twos',
      'threes',
      'fours',
      'fives',
      'sixes',
      'fourOfAKind',
      'fullHouse',
      'smallStraight',
      'largeStraight',
      'yacht',
      'choice',
    ]
    expect([...CATEGORIES].sort()).toEqual([...expectedCategories].sort())
  })

  describe('Ones〜Sixes: 該当する目の合計点', () => {
    const cases: Case[] = [
      { title: 'Ones: 1が2つ含まれる場合は2点', category: 'ones', dice: [1, 1, 2, 3, 4], expected: 2 },
      { title: 'Ones: 1が1つも無い場合は0点', category: 'ones', dice: [2, 3, 4, 5, 6], expected: 0 },
      { title: 'Ones: 1が5つ(ゾロ目)の場合は5点', category: 'ones', dice: [1, 1, 1, 1, 1], expected: 5 },
      { title: 'Twos: 2が3つ含まれる場合は6点', category: 'twos', dice: [2, 2, 2, 3, 5], expected: 6 },
      { title: 'Threes: 3が無い場合は0点', category: 'threes', dice: [1, 2, 4, 5, 6], expected: 0 },
      { title: 'Fours: 4が4つ含まれる場合は16点', category: 'fours', dice: [4, 4, 4, 4, 2], expected: 16 },
      { title: 'Fives: 5が2つ含まれる場合は10点', category: 'fives', dice: [5, 5, 1, 2, 3], expected: 10 },
      { title: 'Sixes: 6が5つ(ゾロ目)の場合は30点', category: 'sixes', dice: [6, 6, 6, 6, 6], expected: 30 },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })

  describe('Four of a Kind: 同じ目が4つ以上あれば5つの合計点', () => {
    const cases: Case[] = [
      {
        title: '4つ同じ目 + 異なる目1つ → 5つの合計点が入る',
        category: 'fourOfAKind',
        dice: [4, 4, 4, 4, 6],
        expected: 22,
      },
      {
        title: '5つ同じ目(ゾロ目)でも成立し、5つの合計点が入る',
        category: 'fourOfAKind',
        dice: [5, 5, 5, 5, 5],
        expected: 25,
      },
      {
        title: '3つ同じ目までしか揃わない場合は不成立で0点',
        category: 'fourOfAKind',
        dice: [3, 3, 3, 2, 2],
        expected: 0,
      },
      {
        title: '全て異なる目の場合は不成立で0点',
        category: 'fourOfAKind',
        dice: [1, 2, 3, 4, 5],
        expected: 0,
      },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })

  describe('Full House: 異なる2種の目がそれぞれ3つ・2つ揃えば25点', () => {
    const cases: Case[] = [
      { title: '3つ+2つの組み合わせは25点', category: 'fullHouse', dice: [2, 2, 2, 5, 5], expected: 25 },
      {
        title: '5つ同じ目(ゾロ目)は3つ+2つの組み合わせでは無いため不成立で0点',
        category: 'fullHouse',
        dice: [4, 4, 4, 4, 4],
        expected: 0,
      },
      {
        title: '4つ+1つの組み合わせは不成立で0点',
        category: 'fullHouse',
        dice: [2, 2, 2, 2, 5],
        expected: 0,
      },
      {
        title: '全て異なる目の場合は不成立で0点',
        category: 'fullHouse',
        dice: [1, 2, 3, 4, 5],
        expected: 0,
      },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })

  describe('Small Straight: 4つ連続する目が含まれていれば30点', () => {
    const cases: Case[] = [
      { title: '1-2-3-4の連続を含む場合は30点', category: 'smallStraight', dice: [1, 2, 3, 4, 6], expected: 30 },
      { title: '2-3-4-5の連続を含む場合は30点', category: 'smallStraight', dice: [2, 3, 4, 5, 1], expected: 30 },
      { title: '3-4-5-6の連続を含む場合は30点', category: 'smallStraight', dice: [3, 4, 5, 6, 1], expected: 30 },
      {
        title: '余りの1つが4連続に含まれる目と重複していても30点',
        category: 'smallStraight',
        dice: [1, 1, 2, 3, 4],
        expected: 30,
      },
      {
        title: '1-2-3-4-5(Large Straight成立)でも4連続を含むので30点',
        category: 'smallStraight',
        dice: [1, 2, 3, 4, 5],
        expected: 30,
      },
      {
        title: '4連続が存在しない場合は不成立で0点',
        category: 'smallStraight',
        dice: [1, 2, 3, 5, 6],
        expected: 0,
      },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })

  describe('Large Straight: 5つ連続する目であれば40点', () => {
    const cases: Case[] = [
      { title: '1-2-3-4-5の連続は40点', category: 'largeStraight', dice: [1, 2, 3, 4, 5], expected: 40 },
      { title: '2-3-4-5-6の連続は40点', category: 'largeStraight', dice: [2, 3, 4, 5, 6], expected: 40 },
      {
        title: '重複があり5連続にならない場合は不成立で0点',
        category: 'largeStraight',
        dice: [1, 2, 3, 4, 4],
        expected: 0,
      },
      {
        title: '4連続(Small Straight相当)までしか無い場合は不成立で0点',
        category: 'largeStraight',
        dice: [1, 2, 3, 4, 6],
        expected: 0,
      },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })

  describe('Yacht: 5つ全て同じ目であれば50点', () => {
    const cases: Case[] = [
      { title: '5つ全て同じ目は50点', category: 'yacht', dice: [6, 6, 6, 6, 6], expected: 50 },
      { title: '4つしか同じ目が無い場合は不成立で0点', category: 'yacht', dice: [6, 6, 6, 6, 5], expected: 0 },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })

  describe('Choice: 役の成立可否に関わらず5つの合計点', () => {
    const cases: Case[] = [
      { title: 'バラバラの目でも5つの合計点が入る', category: 'choice', dice: [1, 2, 3, 4, 5], expected: 15 },
      { title: 'ゾロ目でも5つの合計点が入る', category: 'choice', dice: [6, 6, 6, 6, 6], expected: 30 },
      { title: '最小の目の組み合わせ', category: 'choice', dice: [1, 1, 1, 1, 1], expected: 5 },
    ]
    it.each(cases)('$title', ({ category, dice, expected }) => {
      expect(calculateScore(category, dice)).toBe(expected)
    })
  })
})
