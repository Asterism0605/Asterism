import styleData from '@/data/style-data.json'
import type { StyleDnaImage } from '@/types/style-dna'

export const STYLE_DNA_QUESTION_COUNT = 12
export const STYLE_DNA_OPTIONS_PER_QUESTION = 2
export const STYLE_DNA_EXPLORATION_QUESTION_COUNT = 8
export const STYLE_DNA_MAX_SKIP_COUNT = 30
export const STYLE_DNA_POOL_QUESTION_COUNT =
  STYLE_DNA_QUESTION_COUNT + STYLE_DNA_MAX_SKIP_COUNT

export const STYLE_DNA_IMAGES: StyleDnaImage[] = styleData.map((item) => ({
  id: item.id,
  url: item.url,
  title: item.title,
  styleGroup: item.styleGroup,
  medium: item.medium,
  subMedium: item.subMedium,
  style: [...item.style],
}))
