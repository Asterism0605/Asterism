export interface DNAImage {
  id: string
  url: string
  title?: string
  styleGroup?: string
  medium?: string
  subMedium?: string
  style: string[]
}

export interface DNATestOption {
  id: string
  image: DNAImage
  weights: Record<string, number>
}

export interface DNAQuestion {
  id: string
  question: string
  options: [DNATestOption, DNATestOption]
}

export interface DNAAnswer {
  questionId: string
  selectedOptionId: string
  selectedImage: DNAImage
  weights: Record<string, number>
}

export interface DNAStyleScore {
  tag: string
  score: number
  percentage: number
}

export interface DNAResult {
  topStyles: DNAStyleScore[]
  totalScore: number
}
