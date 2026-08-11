const STORAGE_KEY = 'fritillaria:best-score'
const CURRENT_VERSION = 1

export type StoredBestScore = {
  version: 1
  grandTotal: number
  achievedAt: string
}

function isStoredBestScore(value: unknown): value is StoredBestScore {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    record.version === CURRENT_VERSION &&
    typeof record.grandTotal === 'number' &&
    typeof record.achievedAt === 'string'
  )
}

export function loadBestScore(): StoredBestScore | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return isStoredBestScore(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveBestScoreIfHigher(grandTotal: number): StoredBestScore {
  const current = loadBestScore()
  if (current !== null && current.grandTotal >= grandTotal) {
    return current
  }

  const next: StoredBestScore = {
    version: CURRENT_VERSION,
    grandTotal,
    achievedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
