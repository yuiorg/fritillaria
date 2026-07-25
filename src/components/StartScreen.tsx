import type { StoredBestScore } from '../storage'
import './StartScreen.css'

export type StartScreenProps = {
  bestScore: StoredBestScore | null
  onStart: () => void
}

function StartScreen({ bestScore, onStart }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="start-screen__header">
        <div className="start-screen__title">ヨット</div>
        <div className="start-screen__dice">🎲🎲🎲🎲🎲</div>
      </div>

      <div className="start-screen__best-score">
        <div className="start-screen__best-label">自己ベストスコア</div>
        <div
          className={
            bestScore === null
              ? 'start-screen__best-value start-screen__best-value--empty'
              : 'start-screen__best-value'
          }
        >
          {bestScore === null ? 'まだ記録がありません' : `${bestScore.grandTotal}点`}
        </div>
      </div>

      <button type="button" className="start-screen__start-button" onClick={onStart}>
        ゲームをはじめる
      </button>
    </div>
  )
}

export default StartScreen
