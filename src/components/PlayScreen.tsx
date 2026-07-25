import { useState } from 'react'
import {
  CATEGORIES,
  type Category,
  type DiceRoll,
  type DiceValue,
  LOWER_CATEGORIES,
  UPPER_BONUS_SCORE,
  UPPER_CATEGORIES,
  calculateScore,
  confirmCategory,
  createEmptyScoreSheet,
} from '../logic'
import { loadBestScore, saveBestScoreIfHigher } from '../storage'
import type { GameResult } from '../types'
import './PlayScreen.css'

export type PlayScreenProps = {
  onFinish: (result: GameResult) => void
}

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

function rollDie(): DiceValue {
  return (Math.floor(Math.random() * 6) + 1) as DiceValue
}

function rollAllDice(): DiceRoll {
  return [rollDie(), rollDie(), rollDie(), rollDie(), rollDie()]
}

function PlayScreen({ onFinish }: PlayScreenProps) {
  const [dice, setDice] = useState<DiceRoll>(() => rollAllDice())
  const [kept, setKept] = useState<readonly boolean[]>([false, false, false, false, false])
  const [rollsLeft, setRollsLeft] = useState<0 | 1 | 2 | 3>(2)
  const [sheet, setSheet] = useState(() => createEmptyScoreSheet())

  function handleToggleKeep(index: number) {
    setKept((prev) => prev.map((isKept, i) => (i === index ? !isKept : isKept)))
  }

  function handleRoll() {
    setDice((prev) => prev.map((value, i) => (kept[i] ? value : rollDie())) as unknown as DiceRoll)
    setRollsLeft((prev) => (prev - 1) as 0 | 1 | 2)
  }

  function handleConfirm(category: Category) {
    const newSheet = confirmCategory(sheet, category, dice)

    if (Object.keys(newSheet.scores).length === CATEGORIES.length) {
      const previousBest = loadBestScore()
      saveBestScoreIfHigher(newSheet.grandTotal)
      const isNewBest = previousBest === null || newSheet.grandTotal > previousBest.grandTotal
      setSheet(newSheet)
      onFinish({
        scoreSheet: newSheet,
        isNewBest,
        previousBest: previousBest ? previousBest.grandTotal : null,
      })
      return
    }

    setSheet(newSheet)
    setDice(rollAllDice())
    setKept([false, false, false, false, false])
    setRollsLeft(2)
  }

  const confirmedCount = Object.keys(sheet.scores).length

  const keptIndices = dice.map((_, i) => i).filter((i) => kept[i])
  const freeIndices = dice.map((_, i) => i).filter((i) => !kept[i])

  function getCategoryDisplay(category: Category) {
    const confirmedScore = sheet.scores[category]
    const isConfirmed = confirmedScore !== undefined
    const displayScore = isConfirmed ? confirmedScore : calculateScore(category, dice)
    return { isConfirmed, displayScore }
  }

  function renderCategoryRow(category: Category) {
    const { isConfirmed, displayScore } = getCategoryDisplay(category)
    return (
      <tr key={category} className="play-screen__sheet-row-item">
        <td>{CATEGORY_LABELS[category]}</td>
        <td data-testid={`score-${category}`} data-confirmed={isConfirmed}>
          {displayScore}
        </td>
      </tr>
    )
  }

  function renderActionSlot(category: Category) {
    const { isConfirmed } = getCategoryDisplay(category)
    return (
      <div key={category} className="play-screen__sheet-action-slot">
        {!isConfirmed && (
          <button
            type="button"
            aria-label={`選択: ${CATEGORY_LABELS[category]}`}
            onClick={() => handleConfirm(category)}
          >
            選択
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="play-screen">
      <div className="play-screen__status">
        <span>{3 - rollsLeft} / 3投目</span>
        <span>{confirmedCount} / 12役 完了</span>
      </div>

      <div className="play-screen__dice">
        <div className="play-screen__kept-frame" aria-hidden="true" />
        <div className="play-screen__free-frame" aria-hidden="true" />
        {dice.map((value, i) => {
          const groupIndex = kept[i] ? keptIndices.indexOf(i) : freeIndices.indexOf(i)
          return (
            <button
              key={i}
              type="button"
              data-testid={`dice-${i}`}
              aria-pressed={kept[i]}
              className="play-screen__die"
              style={{ gridRow: kept[i] ? 1 : 2, gridColumn: groupIndex + 1 }}
              onClick={() => handleToggleKeep(i)}
            >
              {value}
            </button>
          )
        })}
        <span className="play-screen__kept-label">キープ</span>
        <button
          type="button"
          className="play-screen__roll"
          disabled={rollsLeft === 0}
          onClick={handleRoll}
        >
          振る
        </button>
      </div>

      <div className="play-screen__sheet-row">
        <table className="play-screen__sheet">
          <colgroup>
            <col />
            <col className="play-screen__sheet-value-col" />
          </colgroup>
          <tbody>{UPPER_CATEGORIES.map(renderCategoryRow)}</tbody>
          <tbody>
            <tr
              className="play-screen__sheet-bonus-row"
              data-achieved={sheet.upperBonus.earned}
            >
              <td>Upper Section ボーナス(63点以上)</td>
              <td data-testid="bonus">
                {sheet.upperBonus.earned ? `+${UPPER_BONUS_SCORE}` : '0'}
              </td>
            </tr>
          </tbody>
          <tbody>{LOWER_CATEGORIES.map(renderCategoryRow)}</tbody>
          <tbody>
            <tr className="play-screen__sheet-total-row">
              <td>合計</td>
              <td data-testid="grand-total">{sheet.grandTotal}</td>
            </tr>
          </tbody>
        </table>
        <div className="play-screen__sheet-actions">
          {UPPER_CATEGORIES.map(renderActionSlot)}
          <div className="play-screen__sheet-action-slot" />
          {LOWER_CATEGORIES.map(renderActionSlot)}
          <div className="play-screen__sheet-action-slot" />
        </div>
      </div>
    </div>
  )
}

export default PlayScreen
