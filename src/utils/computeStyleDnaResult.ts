import type { StyleDnaAnswer } from '@/types/style-dna'

export interface StyleDnaSelection {
  style?: string | null
  weight?: number | null
  image?: string | null
}

export interface StyleDnaScore {
  label: string
  percentage: number
}

export interface StyleDnaAnnotation {
  label: string
  value: string
  position: 'left' | 'right' | 'top-right'
}

export interface ComputedStyleDnaResult {
  isFallback: boolean
  primaryStyle: string
  styles: StyleDnaScore[]
  annotations: StyleDnaAnnotation[]
  heroImage: string
}

const FALLBACK_HERO_IMAGE = '/images/astronaut-dna.png'

const FALLBACK_STYLES: StyleDnaScore[] = [
  { label: 'Minimalism', percentage: 70 },
  { label: 'Style B', percentage: 20 },
  { label: 'Style C', percentage: 10 },
]

const ANNOTATION_POSITIONS: StyleDnaAnnotation['position'][] = ['top-right', 'left', 'right']

const annotationsFor = (styles: StyleDnaScore[]): StyleDnaAnnotation[] =>
  styles.map((style, index) => ({
    label: style.label,
    value: `${style.percentage}%`,
    position: ANNOTATION_POSITIONS[index],
  }))

const fallbackResult = (): ComputedStyleDnaResult => ({
  isFallback: true,
  primaryStyle: 'Minimalism',
  styles: FALLBACK_STYLES.map((style) => ({ ...style })),
  annotations: annotationsFor(FALLBACK_STYLES),
  heroImage: FALLBACK_HERO_IMAGE,
})

const isPositiveWeight = (weight: number) => Number.isFinite(weight) && weight > 0

const isStyleDnaAnswer = (selection: StyleDnaSelection | StyleDnaAnswer): selection is StyleDnaAnswer =>
  'weights' in selection && 'selectedImage' in selection

const normalizeSelectionHistory = (
  selectionHistory: Array<StyleDnaSelection | StyleDnaAnswer>,
): StyleDnaSelection[] =>
  selectionHistory.flatMap((selection) => {
    if (!isStyleDnaAnswer(selection)) {
      return selection
    }

    return Object.entries(selection.weights).map(([style, weight]) => ({
      style,
      weight,
      image: selection.selectedImage.url,
    }))
  })

export function computeStyleDnaResult(
  selectionHistory?: Array<StyleDnaSelection | StyleDnaAnswer>,
): ComputedStyleDnaResult {
  if (!Array.isArray(selectionHistory) || selectionHistory.length === 0) {
    return fallbackResult()
  }

  const normalizedSelections = normalizeSelectionHistory(selectionHistory)
  const styleTotals = new Map<string, { total: number; firstIndex: number }>()
  const validSelections: Array<Required<Pick<StyleDnaSelection, 'style'>> & StyleDnaSelection> = []

  normalizedSelections.forEach((selection, index) => {
    const style = selection.style?.trim()
    const weight = selection.weight ?? 1

    if (!style || !isPositiveWeight(weight)) {
      return
    }

    validSelections.push({ ...selection, style })
    const current = styleTotals.get(style)

    if (current) {
      current.total += weight
    } else {
      styleTotals.set(style, { total: weight, firstIndex: index })
    }
  })

  if (styleTotals.size === 0) {
    return fallbackResult()
  }

  const styles = Array.from(styleTotals.entries())
    .map(([label, score]) => ({
      label,
      total: score.total,
      firstIndex: score.firstIndex,
    }))
    .sort((a, b) => b.total - a.total || a.firstIndex - b.firstIndex)
    .slice(0, 3)

  const displayedTotalWeight = styles.reduce((total, style) => total + style.total, 0)
  const displayedStyles = styles.map((style) => ({
    label: style.label,
    percentage: Math.round((style.total / displayedTotalWeight) * 100),
  }))

  const roundedTotal = displayedStyles.reduce((total, style) => total + style.percentage, 0)
  displayedStyles[0].percentage += 100 - roundedTotal

  const primaryStyle = displayedStyles[0].label
  const heroImage =
    validSelections.find((selection) => selection.style === primaryStyle && selection.image?.trim())?.image ??
    FALLBACK_HERO_IMAGE

  return {
    isFallback: false,
    primaryStyle,
    styles: displayedStyles,
    annotations: annotationsFor(displayedStyles),
    heroImage,
  }
}
