import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadBestScore, saveBestScoreIfHigher } from './bestScore'

const STORAGE_KEY = 'fritillaria:best-score'

beforeEach(() => {
  localStorage.clear()
})

describe('loadBestScore', () => {
  it('保存データが存在しない場合はnullを返す', () => {
    expect(loadBestScore()).toBeNull()
  })

  it('有効なデータが保存されている場合はそのまま返す', () => {
    const stored = { version: 1, grandTotal: 150, achievedAt: '2026-01-01T00:00:00.000Z' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    expect(loadBestScore()).toEqual(stored)
  })

  it('JSON.parseに失敗するデータの場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json')

    expect(loadBestScore()).toBeNull()
  })

  it('versionが一致しないデータの場合はnullを返す', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, grandTotal: 150, achievedAt: '2026-01-01T00:00:00.000Z' }),
    )

    expect(loadBestScore()).toBeNull()
  })

  it('grandTotalフィールドが欠落している場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, achievedAt: '2026-01-01T00:00:00.000Z' }))

    expect(loadBestScore()).toBeNull()
  })

  it('achievedAtフィールドが欠落している場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, grandTotal: 150 }))

    expect(loadBestScore()).toBeNull()
  })

  it('JSONとしては妥当だがオブジェクトでない場合(nullなど)はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(null))

    expect(loadBestScore()).toBeNull()
  })
})

describe('saveBestScoreIfHigher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('保存データが存在しない場合、渡されたgrandTotalで新規保存する', () => {
    const result = saveBestScoreIfHigher(100)

    expect(result).toEqual({ version: 1, grandTotal: 100, achievedAt: '2026-07-17T12:00:00.000Z' })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(result)
  })

  it('既存の自己ベストを上回る場合、新しい値で更新する', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, grandTotal: 100, achievedAt: '2026-01-01T00:00:00.000Z' }),
    )

    const result = saveBestScoreIfHigher(150)

    expect(result).toEqual({ version: 1, grandTotal: 150, achievedAt: '2026-07-17T12:00:00.000Z' })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(result)
  })

  it('既存の自己ベストと同点の場合は更新しない', () => {
    const existing = { version: 1, grandTotal: 100, achievedAt: '2026-01-01T00:00:00.000Z' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

    const result = saveBestScoreIfHigher(100)

    expect(result).toEqual(existing)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(existing)
  })

  it('既存の自己ベストを下回る場合は更新しない', () => {
    const existing = { version: 1, grandTotal: 200, achievedAt: '2026-01-01T00:00:00.000Z' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

    const result = saveBestScoreIfHigher(100)

    expect(result).toEqual(existing)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(existing)
  })

  it('保存データが破損している場合は既存扱いせず、渡されたgrandTotalで新規保存する', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json')

    const result = saveBestScoreIfHigher(50)

    expect(result).toEqual({ version: 1, grandTotal: 50, achievedAt: '2026-07-17T12:00:00.000Z' })
  })
})
