import { calculateDNA } from '@/utils/calculateDNA'
import type { StyleDnaAnswer, StyleDnaResult } from '@/types/style-dna'

export const computeStyleDnaResult = (answers: StyleDnaAnswer[]): StyleDnaResult => calculateDNA(answers)

