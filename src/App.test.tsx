import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createEmptyScoreSheet } from './logic'
import type { StoredBestScore } from './storage'
import type { GameResult } from './types'

const { loadBestScoreMock } = vi.hoisted(() => ({
  loadBestScoreMock: vi.fn(),
}))

vi.mock('./storage', () => ({
  loadBestScore: loadBestScoreMock,
}))

vi.mock('./components/StartScreen', () => ({
  default: ({ bestScore, onStart }: { bestScore: StoredBestScore | null; onStart: () => void }) => (
    <div>
      <span data-testid="start-best-score">{bestScore ? bestScore.grandTotal : 'none'}</span>
      <button type="button" onClick={onStart}>
        start
      </button>
    </div>
  ),
}))

vi.mock('./components/PlayScreen', () => ({
  default: ({ onFinish }: { onFinish: (result: GameResult) => void }) => (
    <button type="button" onClick={() => onFinish(dummyResult)}>
      finish
    </button>
  ),
}))

vi.mock('./components/ResultScreen', () => ({
  default: ({
    bestScore,
    lastResult,
    onBackToStart,
  }: {
    bestScore: StoredBestScore | null
    lastResult: GameResult
    onBackToStart: () => void
  }) => (
    <div>
      <span data-testid="result-best-score">{bestScore ? bestScore.grandTotal : 'none'}</span>
      <span data-testid="result-grand-total">{lastResult.scoreSheet.grandTotal}</span>
      <button type="button" onClick={onBackToStart}>
        back
      </button>
    </div>
  ),
}))

const initialBestScore: StoredBestScore = {
  version: 1,
  grandTotal: 150,
  achievedAt: '2026-01-01T00:00:00.000Z',
}
const updatedBestScore: StoredBestScore = {
  version: 1,
  grandTotal: 200,
  achievedAt: '2026-01-02T00:00:00.000Z',
}

const dummyResult: GameResult = {
  scoreSheet: createEmptyScoreSheet(),
  isNewBest: true,
  previousBest: 150,
}

describe('App', () => {
  beforeEach(() => {
    loadBestScoreMock.mockReset()
  })

  it('マウント時にloadBestScoreを呼び、start画面に自己ベストを渡す', () => {
    loadBestScoreMock.mockReturnValueOnce(initialBestScore)

    render(<App />)

    expect(loadBestScoreMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('start-best-score')).toHaveTextContent('150')
  })

  it('自己ベスト未記録時はnullがstart画面に渡る', () => {
    loadBestScoreMock.mockReturnValueOnce(null)

    render(<App />)

    expect(screen.getByTestId('start-best-score')).toHaveTextContent('none')
  })

  it('start→play→result→startの一方向遷移がconditional renderingで動作する', () => {
    loadBestScoreMock.mockReturnValueOnce(initialBestScore).mockReturnValueOnce(updatedBestScore)

    render(<App />)

    expect(screen.getByText('start')).toBeInTheDocument()

    fireEvent.click(screen.getByText('start'))
    expect(screen.queryByText('start')).not.toBeInTheDocument()
    expect(screen.getByText('finish')).toBeInTheDocument()

    fireEvent.click(screen.getByText('finish'))
    expect(screen.queryByText('finish')).not.toBeInTheDocument()
    expect(screen.getByText('back')).toBeInTheDocument()

    fireEvent.click(screen.getByText('back'))
    expect(screen.queryByText('back')).not.toBeInTheDocument()
    expect(screen.getByText('start')).toBeInTheDocument()
  })

  it('PlayScreenのonFinishでbestScore/lastResultを更新してresult画面へ渡す', () => {
    loadBestScoreMock.mockReturnValueOnce(initialBestScore).mockReturnValueOnce(updatedBestScore)

    render(<App />)
    fireEvent.click(screen.getByText('start'))
    fireEvent.click(screen.getByText('finish'))

    expect(loadBestScoreMock).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('result-best-score')).toHaveTextContent('200')
    expect(screen.getByTestId('result-grand-total')).toHaveTextContent(
      String(dummyResult.scoreSheet.grandTotal),
    )
  })

  it('result→startで戻った後は再取得済みのbestScoreがstart画面に維持される', () => {
    loadBestScoreMock.mockReturnValueOnce(initialBestScore).mockReturnValueOnce(updatedBestScore)

    render(<App />)
    fireEvent.click(screen.getByText('start'))
    fireEvent.click(screen.getByText('finish'))
    fireEvent.click(screen.getByText('back'))

    expect(loadBestScoreMock).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('start-best-score')).toHaveTextContent('200')
  })
})
