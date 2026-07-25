import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StoredBestScore } from '../storage'
import StartScreen from './StartScreen'

function buildBestScore(grandTotal: number): StoredBestScore {
  return { version: 1, grandTotal, achievedAt: '2026-01-01T00:00:00.000Z' }
}

describe('StartScreen', () => {
  it('自己ベストスコアがある場合、点数を表示する', () => {
    render(<StartScreen bestScore={buildBestScore(275)} onStart={vi.fn()} />)

    expect(screen.getByText('275点')).toBeInTheDocument()
  })

  it('自己ベストスコアが無い場合、未記録の表示をする', () => {
    render(<StartScreen bestScore={null} onStart={vi.fn()} />)

    expect(screen.getByText('まだ記録がありません')).toBeInTheDocument()
  })

  it('「ゲームをはじめる」ボタンをクリックするとonStartが呼ばれる', () => {
    const onStart = vi.fn()
    render(<StartScreen bestScore={null} onStart={onStart} />)

    fireEvent.click(screen.getByRole('button', { name: 'ゲームをはじめる' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
