import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadBestScore, saveBestScoreIfHigher } from './bestScore'

const STORAGE_KEY = 'fritillaria:best-score'
const LEGACY_STORAGE_KEY = 'statice:best-score'

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

describe('loadBestScore(旧キーからの移行)', () => {
  const legacyStored = { version: 1, grandTotal: 150, achievedAt: '2026-01-01T00:00:00.000Z' }

  it('旧キーにのみデータがある場合、その値を返す', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyStored))

    expect(loadBestScore()).toEqual(legacyStored)
  })

  it('旧キーから読んだ場合、新キーに保存し直す', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyStored))

    loadBestScore()

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(legacyStored)
  })

  it('新旧どちらにもデータがある場合、新キーの値を優先する', () => {
    const current = { version: 1, grandTotal: 200, achievedAt: '2026-02-01T00:00:00.000Z' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyStored))

    expect(loadBestScore()).toEqual(current)
  })

  it('旧キーのデータが破損している場合はnullを返す', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, '{invalid json')

    expect(loadBestScore()).toBeNull()
  })

  it('新キーへの保存に失敗しても、旧キーから読んだ値は返す', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyStored))
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(loadBestScore()).toEqual(legacyStored)

    setItem.mockRestore()
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
