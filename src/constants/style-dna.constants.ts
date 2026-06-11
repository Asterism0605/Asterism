import styleData from '@/data/style-data.json'
import type { StyleDnaImage } from '@/types/style-dna'

export const STYLE_DNA_QUESTION_COUNT = 12
export const STYLE_DNA_OPTIONS_PER_QUESTION = 2

export const STYLE_DNA_IMAGES: StyleDnaImage[] = styleData.map((item) => ({
  id: item.id,
  url: item.url,
  title: item.title,
  style: [...item.style],
}))

