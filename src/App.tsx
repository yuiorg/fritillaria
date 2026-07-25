import { useEffect, useState } from 'react'
import PlayScreen from './components/PlayScreen'
import ResultScreen from './components/ResultScreen'
import StartScreen from './components/StartScreen'
import { loadBestScore } from './storage'
import type { StoredBestScore } from './storage'
import type { GameResult, Screen } from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [bestScore, setBestScore] = useState<StoredBestScore | null>(null)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)

  useEffect(() => {
    setBestScore(loadBestScore())
  }, [])

  function handleFinish(result: GameResult) {
    setLastResult(result)
    setBestScore(loadBestScore())
    setScreen('result')
  }

  if (screen === 'play') {
    return <PlayScreen onFinish={handleFinish} />
  }

  if (screen === 'result' && lastResult !== null) {
    return (
      <ResultScreen
        bestScore={bestScore}
        lastResult={lastResult}
        onBackToStart={() => setScreen('start')}
      />
    )
  }

  return <StartScreen bestScore={bestScore} onStart={() => setScreen('play')} />
}

export default App
