const STORAGE_KEY = 'fritillaria:best-score'
// リポジトリ移行前のキー。既にプレイ済みのユーザーの自己ベストを読み替えるために残している
const LEGACY_STORAGE_KEY = 'statice:best-score'
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

function readAt(key: string): StoredBestScore | null {
  const raw = localStorage.getItem(key)
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

export function loadBestScore(): StoredBestScore | null {
  const current = readAt(STORAGE_KEY)
  if (current !== null) {
    return current
  }

  const legacy = readAt(LEGACY_STORAGE_KEY)
  if (legacy === null) {
    return null
  }

  // 旧キーの自己ベストを新キーに保存し直す。書き込みに失敗しても読み取り自体は
  // 成立させたいので、ここでは握り潰して値を返す
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
  } catch {
    // 次回の読み込みで再度移行を試みる
  }
  return legacy
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
