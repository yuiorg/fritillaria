import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PlayScreen from './PlayScreen'

const { loadBestScoreMock, saveBestScoreIfHigherMock } = vi.hoisted(() => ({
  loadBestScoreMock: vi.fn(),
  saveBestScoreIfHigherMock: vi.fn(),
}))

vi.mock('../storage', () => ({
  loadBestScore: loadBestScoreMock,
  saveBestScoreIfHigher: saveBestScoreIfHigherMock,
}))

// design/3/play-screen-*.html のモックアップに合わせた表示名(#3)
const CATEGORY_LABELS: Record<string, string> = {
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
const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS)

// value = Math.floor(Math.random() * 6) + 1 という実装を想定し、
// バケットの境界を避けるため +0.01 のマージンを取る
function randomFor(value: number) {
  return (value - 1) / 6 + 0.01
}

function mockNextRoll(values: number[]) {
  const spy = vi.spyOn(Math, 'random')
  for (const value of values) {
    spy.mockReturnValueOnce(randomFor(value))
  }
  return spy
}

function selectButton(category: string) {
  return screen.getByRole('button', { name: `選択: ${CATEGORY_LABELS[category]}` })
}

describe('PlayScreen', () => {
  beforeEach(() => {
    loadBestScoreMock.mockReset()
    saveBestScoreIfHigherMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('マウント時に5個のダイスが自動で振られ、1 / 3投目・0 / 12役 完了と表示される', () => {
    mockNextRoll([1, 1, 1, 1, 1])

    render(<PlayScreen onFinish={vi.fn()} />)

    expect(screen.getByText('1 / 3投目')).toBeInTheDocument()
    expect(screen.getByText('0 / 12役 完了')).toBeInTheDocument()
    for (let i = 0; i < 5; i += 1) {
      expect(screen.getByTestId(`dice-${i}`)).toHaveTextContent('1')
    }
  })

  it('未確定カテゴリは現在のダイス目から計算されるプレビュー得点を表示し、合計とボーナスは確定分のみで0のまま', () => {
    mockNextRoll([1, 1, 1, 1, 1])

    render(<PlayScreen onFinish={vi.fn()} />)

    const expectedPreview: Record<string, string> = {
      ones: '5',
      twos: '0',
      threes: '0',
      fours: '0',
      fives: '0',
      sixes: '0',
      fourOfAKind: '5',
      fullHouse: '0',
      smallStraight: '0',
      largeStraight: '0',
      yacht: '50',
      choice: '5',
    }
    for (const category of CATEGORY_ORDER) {
      expect(screen.getByTestId(`score-${category}`)).toHaveTextContent(expectedPreview[category])
    }
    expect(screen.getByTestId('bonus')).toHaveTextContent('0')
    expect(screen.getByTestId('grand-total')).toHaveTextContent('0')
  })

  it('ダイスをクリックするとキープ状態がトグルされる', () => {
    mockNextRoll([1, 2, 3, 4, 5])

    render(<PlayScreen onFinish={vi.fn()} />)

    const die = screen.getByTestId('dice-0')
    expect(die).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(die)
    expect(die).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(die)
    expect(die).toHaveAttribute('aria-pressed', 'false')
  })

  it('振るボタンはキープしていないダイスだけを振り直し残り回数を減らし、0になると無効化される', () => {
    mockNextRoll([1, 1, 1, 1, 1])
    render(<PlayScreen onFinish={vi.fn()} />)

    fireEvent.click(screen.getByTestId('dice-0'))

    mockNextRoll([2, 3, 4, 5])
    fireEvent.click(screen.getByRole('button', { name: '振る' }))

    expect(screen.getByTestId('dice-0')).toHaveTextContent('1')
    expect(screen.getByTestId('dice-1')).toHaveTextContent('2')
    expect(screen.getByTestId('dice-2')).toHaveTextContent('3')
    expect(screen.getByTestId('dice-3')).toHaveTextContent('4')
    expect(screen.getByTestId('dice-4')).toHaveTextContent('5')
    expect(screen.getByText('2 / 3投目')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '振る' })).toBeEnabled()

    mockNextRoll([6, 6, 6, 6])
    fireEvent.click(screen.getByRole('button', { name: '振る' }))

    expect(screen.getByText('3 / 3投目')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '振る' })).toBeDisabled()
  })

  it('役を確定すると得点が固定表示になり選択ボタンが消え、完了数が増え、新しいターンとしてダイスが振り直される', () => {
    mockNextRoll([1, 1, 1, 1, 1])
    render(<PlayScreen onFinish={vi.fn()} />)

    mockNextRoll([6, 6, 6, 6, 6])
    fireEvent.click(selectButton('ones'))

    expect(screen.getByTestId('score-ones')).toHaveTextContent('5')
    expect(screen.queryByRole('button', { name: '選択: Ones' })).not.toBeInTheDocument()
    expect(screen.getByText('1 / 12役 完了')).toBeInTheDocument()
    expect(screen.getByText('1 / 3投目')).toBeInTheDocument()
    for (let i = 0; i < 5; i += 1) {
      expect(screen.getByTestId(`dice-${i}`)).toHaveTextContent('6')
    }
  })

  it('Upper Sectionの確定得点合計が63点以上になるとボーナスが加算される', () => {
    mockNextRoll([1, 1, 1, 1, 1])
    render(<PlayScreen onFinish={vi.fn()} />)

    // ones〜sixesをそれぞれ対応する目のみで確定させる(5×(1+2+3+4+5+6)=105 ≥ 63)
    // 役確定直後の自動振り直しが「次に確定する役」用のダイス目になるため、
    // 1つ先の値をあらかじめキューしておく
    const upperValues = [1, 2, 3, 4, 5, 6]
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
    upperCategories.forEach((category, index) => {
      const nextValue = upperValues[index + 1]
      if (nextValue !== undefined) {
        mockNextRoll([nextValue, nextValue, nextValue, nextValue, nextValue])
      }
      fireEvent.click(selectButton(category))
    })

    expect(screen.getByTestId('bonus')).toHaveTextContent('+35')
    expect(screen.getByTestId('grand-total')).toHaveTextContent('140')
  })

  it('自己ベスト未更新の場合、12役確定でsaveBestScoreIfHigherを呼びisNewBest:falseでonFinishする', () => {
    loadBestScoreMock.mockReturnValueOnce({
      version: 1,
      grandTotal: 100,
      achievedAt: '2026-01-01T00:00:00.000Z',
    })
    saveBestScoreIfHigherMock.mockReturnValueOnce({
      version: 1,
      grandTotal: 100,
      achievedAt: '2026-01-01T00:00:00.000Z',
    })
    mockNextRoll([1, 1, 1, 1, 1])
    const onFinish = vi.fn()
    render(<PlayScreen onFinish={onFinish} />)

    CATEGORY_ORDER.forEach((category, index) => {
      const isLast = index === CATEGORY_ORDER.length - 1
      if (!isLast) {
        mockNextRoll([1, 1, 1, 1, 1])
      }
      fireEvent.click(selectButton(category))
    })

    // ones..sixesは全て1で確定(上段合計5、ボーナス無し) + fourOfAKind5 + yacht50 + choice5 = 65
    expect(saveBestScoreIfHigherMock).toHaveBeenCalledWith(65)
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith({
      scoreSheet: expect.objectContaining({ grandTotal: 65 }),
      isNewBest: false,
      previousBest: 100,
    })
  })

  it('自己ベスト未記録の場合、12役確定でisNewBest:true, previousBest:nullでonFinishする', () => {
    loadBestScoreMock.mockReturnValueOnce(null)
    saveBestScoreIfHigherMock.mockReturnValueOnce({
      version: 1,
      grandTotal: 65,
      achievedAt: '2026-01-01T00:00:00.000Z',
    })
    mockNextRoll([1, 1, 1, 1, 1])
    const onFinish = vi.fn()
    render(<PlayScreen onFinish={onFinish} />)

    CATEGORY_ORDER.forEach((category, index) => {
      const isLast = index === CATEGORY_ORDER.length - 1
      if (!isLast) {
        mockNextRoll([1, 1, 1, 1, 1])
      }
      fireEvent.click(selectButton(category))
    })

    expect(onFinish).toHaveBeenCalledWith({
      scoreSheet: expect.objectContaining({ grandTotal: 65 }),
      isNewBest: true,
      previousBest: null,
    })
  })
})
