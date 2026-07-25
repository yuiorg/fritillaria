import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  type Category,
  type ScoreSheet,
  UPPER_BONUS_SCORE,
  UPPER_BONUS_THRESHOLD,
  UPPER_CATEGORIES,
} from '../logic'
import type { StoredBestScore } from '../storage'
import type { GameResult } from '../types'
import ResultScreen from './ResultScreen'

// design/4/result-screen-*.html のモックアップに合わせた表示名(#4)、PlayScreen(#44)と同じラベル
const CATEGORY_LABELS: Record<Category, string> = {
  ones: 'Ones',
  twos: 'Twos',
  threes: 'Threes',
  fours: 'Fours',
  fives: 'Fives',
  sixes: 'Sixes',
  fourOfAKind: 'Four of a Kind',
  fullHouse: 'Full House',
  smallStraight: 'Small Straight',
  largeStraight: 'Large Straight',
  yacht: 'Yacht',
  choice: 'Choice',
}

// design/4のシナリオ1(ボーナス達成/自己ベスト更新)に合わせた確定得点
const BONUS_ACHIEVED_SCORES: Record<Category, number> = {
  ones: 3,
  twos: 6,
  threes: 9,
  fours: 16,
  fives: 20,
  sixes: 12,
  fourOfAKind: 22,
  fullHouse: 25,
  smallStraight: 30,
  largeStraight: 40,
  yacht: 50,
  choice: 24,
}

// design/4のシナリオ2(ボーナス未達成/自己ベスト未更新)に合わせた確定得点
const BONUS_MISSED_SCORES: Record<Category, number> = {
  ones: 2,
  twos: 4,
  threes: 3,
  fours: 8,
  fives: 5,
  sixes: 6,
  fourOfAKind: 0,
  fullHouse: 0,
  smallStraight: 30,
  largeStraight: 0,
  yacht: 0,
  choice: 18,
}

function buildScoreSheet(scores: Record<Category, number>): ScoreSheet {
  const upperSubtotal = UPPER_CATEGORIES.reduce((total, category) => total + scores[category], 0)
  const earned = upperSubtotal >= UPPER_BONUS_THRESHOLD
  const scoresTotal = Object.values(scores).reduce((total: number, score) => total + score, 0)
  return {
    scores,
    upperBonus: {
      earned,
      upperSubtotal,
      remaining: earned ? 0 : UPPER_BONUS_THRESHOLD - upperSubtotal,
    },
    grandTotal: scoresTotal + (earned ? UPPER_BONUS_SCORE : 0),
  }
}

function buildResult(scores: Record<Category, number>, overrides: Partial<GameResult> = {}): GameResult {
  return {
    scoreSheet: buildScoreSheet(scores),
    isNewBest: false,
    previousBest: null,
    ...overrides,
  }
}

function buildBestScore(grandTotal: number): StoredBestScore {
  return { version: 1, grandTotal, achievedAt: '2026-01-01T00:00:00.000Z' }
}

describe('ResultScreen', () => {
  it('各役の確定得点・Upper Section小計・ボーナス達成・合計を表示する', () => {
    const lastResult = buildResult(BONUS_ACHIEVED_SCORES, { previousBest: 275, isNewBest: true })

    render(<ResultScreen bestScore={buildBestScore(292)} lastResult={lastResult} onBackToStart={vi.fn()} />)

    for (const category of Object.keys(CATEGORY_LABELS) as Category[]) {
      expect(screen.getByTestId(`score-${category}`)).toHaveTextContent(String(BONUS_ACHIEVED_SCORES[category]))
    }
    expect(screen.getByTestId('upper-subtotal')).toHaveTextContent('66')
    expect(screen.getByTestId('bonus')).toHaveTextContent(`+${UPPER_BONUS_SCORE}`)
    expect(screen.getByTestId('grand-total')).toHaveTextContent('292')
    expect(screen.getByTestId('total-cell')).toHaveTextContent('292')
  })

  it('Upper Sectionが63点未満のときボーナスは0と表示される', () => {
    const lastResult = buildResult(BONUS_MISSED_SCORES, { previousBest: 275, isNewBest: false })

    render(<ResultScreen bestScore={buildBestScore(275)} lastResult={lastResult} onBackToStart={vi.fn()} />)

    expect(screen.getByTestId('upper-subtotal')).toHaveTextContent('28')
    expect(screen.getByTestId('bonus')).toHaveTextContent('0')
    expect(screen.getByTestId('grand-total')).toHaveTextContent('76')
  })

  it('自己ベスト更新時はバッジと前回の自己ベストを表示する', () => {
    const lastResult = buildResult(BONUS_ACHIEVED_SCORES, { previousBest: 275, isNewBest: true })

    render(<ResultScreen bestScore={buildBestScore(292)} lastResult={lastResult} onBackToStart={vi.fn()} />)

    expect(screen.getByTestId('best-badge')).toHaveTextContent('🏆 自己ベスト更新!')
    expect(screen.getByTestId('best-compare')).toHaveTextContent('前回の自己ベスト: 275点')
  })

  it('自己ベスト未更新時はバッジを表示せず現在の自己ベストを表示する', () => {
    const lastResult = buildResult(BONUS_MISSED_SCORES, { previousBest: 275, isNewBest: false })

    render(<ResultScreen bestScore={buildBestScore(275)} lastResult={lastResult} onBackToStart={vi.fn()} />)

    expect(screen.queryByTestId('best-badge')).not.toBeInTheDocument()
    expect(screen.getByTestId('best-compare')).toHaveTextContent('自己ベスト: 275点')
  })

  it('自己ベスト未更新かつbestScoreの再読み込みに失敗した場合はlastResult.previousBestを表示する', () => {
    const lastResult = buildResult(BONUS_MISSED_SCORES, { previousBest: 275, isNewBest: false })

    render(<ResultScreen bestScore={null} lastResult={lastResult} onBackToStart={vi.fn()} />)

    expect(screen.getByTestId('best-compare')).toHaveTextContent('自己ベスト: 275点')
  })

  it('自己ベスト記録が存在しなかった初回プレイではバッジを表示し「はじめての記録です」と表示する', () => {
    const lastResult = buildResult(BONUS_MISSED_SCORES, { previousBest: null, isNewBest: true })

    render(<ResultScreen bestScore={buildBestScore(76)} lastResult={lastResult} onBackToStart={vi.fn()} />)

    expect(screen.getByTestId('best-badge')).toHaveTextContent('🏆 自己ベスト更新!')
    expect(screen.getByTestId('best-compare')).toHaveTextContent('はじめての記録です')
  })

  it('「スタート画面に戻る」ボタンをクリックするとonBackToStartが呼ばれる', () => {
    const onBackToStart = vi.fn()
    const lastResult = buildResult(BONUS_MISSED_SCORES, { previousBest: 275, isNewBest: false })

    render(<ResultScreen bestScore={buildBestScore(275)} lastResult={lastResult} onBackToStart={onBackToStart} />)

    fireEvent.click(screen.getByRole('button', { name: 'スタート画面に戻る' }))
    expect(onBackToStart).toHaveBeenCalledTimes(1)
  })
})
