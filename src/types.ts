import type { ScoreSheet } from './logic'

export type Screen = 'start' | 'play' | 'result'

export type GameResult = {
  scoreSheet: ScoreSheet
  isNewBest: boolean
  previousBest: number | null
}
