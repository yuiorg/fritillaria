import { LOWER_CATEGORIES, type Category, UPPER_BONUS_SCORE, UPPER_CATEGORIES } from '../logic'
import type { StoredBestScore } from '../storage'
import type { GameResult } from '../types'
import './ResultScreen.css'

export type ResultScreenProps = {
  bestScore: StoredBestScore | null
  lastResult: GameResult
  onBackToStart: () => void
}

// design/3(PlayScreen)と同じ表示名(#3)
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

function ResultScreen({ bestScore, lastResult, onBackToStart }: ResultScreenProps) {
  const { scoreSheet, isNewBest, previousBest } = lastResult

  const bestCompareText = isNewBest
    ? previousBest !== null
      ? `前回の自己ベスト: ${previousBest}点`
      : 'はじめての記録です'
    : `自己ベスト: ${bestScore?.grandTotal ?? previousBest}点`

  return (
    <div className="result-screen">
      <div className="result-screen__header">
        <div className="result-screen__subtitle">ゲーム終了</div>
        {isNewBest && (
          <div data-testid="best-badge" className="result-screen__best-badge">
            🏆 自己ベスト更新!
          </div>
        )}
        <div data-testid="grand-total" className="result-screen__grand-total">
          {scoreSheet.grandTotal}
        </div>
        <div data-testid="best-compare" className="result-screen__best-compare">
          {bestCompareText}
        </div>
      </div>

      <table className="result-screen__sheet">
        <colgroup>
          <col />
          <col className="result-screen__sheet-value-col" />
        </colgroup>
        <tbody>
          {UPPER_CATEGORIES.map((category) => (
            <tr key={category}>
              <td>{CATEGORY_LABELS[category]}</td>
              <td data-testid={`score-${category}`}>{scoreSheet.scores[category]}</td>
            </tr>
          ))}
          <tr className="result-screen__subtotal-row">
            <td>小計</td>
            <td data-testid="upper-subtotal">{scoreSheet.upperBonus.upperSubtotal}</td>
          </tr>
          <tr>
            <td
              className={
                scoreSheet.upperBonus.earned ? 'result-screen__bonus-earned' : 'result-screen__bonus-missed'
              }
            >
              Upper Section ボーナス(63点以上)
            </td>
            <td
              data-testid="bonus"
              className={
                scoreSheet.upperBonus.earned ? 'result-screen__bonus-earned' : 'result-screen__bonus-missed'
              }
            >
              {scoreSheet.upperBonus.earned ? `+${UPPER_BONUS_SCORE}` : '0'}
            </td>
          </tr>
          <tr className="result-screen__spacer-row">
            <td colSpan={2} />
          </tr>
          {LOWER_CATEGORIES.map((category) => (
            <tr key={category}>
              <td>{CATEGORY_LABELS[category]}</td>
              <td data-testid={`score-${category}`}>{scoreSheet.scores[category]}</td>
            </tr>
          ))}
          <tr className="result-screen__total-row">
            <td>合計</td>
            <td data-testid="total-cell">{scoreSheet.grandTotal}</td>
          </tr>
        </tbody>
      </table>

      <button type="button" className="result-screen__back-button" onClick={onBackToStart}>
        スタート画面に戻る
      </button>
    </div>
  )
}

export default ResultScreen
