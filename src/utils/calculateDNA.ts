import type { DNAAnswer, DNAResult, DNAStyleScore } from '@/types/dna-test'

const TOP_STYLE_LIMIT = 3

const roundToPrecision = (value: number, precision = 4) => Number(value.toFixed(precision))

const sortStyleScores = ([tagA, scoreA]: [string, number], [tagB, scoreB]: [string, number]) => {
  if (scoreA !== scoreB) {
    return scoreB - scoreA
  }

  return tagA.localeCompare(tagB)
}

export const calculateDNA = (answers: DNAAnswer[]): DNAResult => {
  const scoreMap = answers.reduce<Record<string, number>>((scores, answer) => {
    Object.entries(answer.weights).forEach(([tag, weight]) => {
      scores[tag] = (scores[tag] ?? 0) + weight
    })

    return scores
  }, {})

  const totalScore = Object.values(scoreMap).reduce((sum, score) => sum + score, 0)
  const topEntries = Object.entries(scoreMap).sort(sortStyleScores).slice(0, TOP_STYLE_LIMIT)

  const topStyles: DNAStyleScore[] = topEntries.map(([tag, score]) => ({
    tag,
    score: roundToPrecision(score),
    percentage: totalScore === 0 ? 0 : roundToPrecision((score / totalScore) * 100, 1),
  }))

  return {
    topStyles,
    totalScore: roundToPrecision(totalScore),
  }
}

