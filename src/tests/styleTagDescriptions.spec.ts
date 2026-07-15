import { describe, expect, it } from 'vitest'
import { STYLE_TAG_DESCRIPTIONS } from '@/data/styleTagDescriptions'
import { STYLE_TAG_ZH } from '@/data/styleLabels'

describe('STYLE_TAG_DESCRIPTIONS', () => {
  it('has an entry for every tag in STYLE_TAG_ZH, with non-empty zh and en text', () => {
    const tagKeys = Object.keys(STYLE_TAG_ZH)

    tagKeys.forEach((tag) => {
      const entry = STYLE_TAG_DESCRIPTIONS[tag]
      expect(entry, `missing description for "${tag}"`).toBeDefined()
      expect(entry.zh.length).toBeGreaterThan(0)
      expect(entry.en.length).toBeGreaterThan(0)
    })
  })

  it('does not define descriptions for tags outside STYLE_TAG_ZH', () => {
    const tagKeys = new Set(Object.keys(STYLE_TAG_ZH))

    Object.keys(STYLE_TAG_DESCRIPTIONS).forEach((tag) => {
      expect(tagKeys.has(tag), `"${tag}" is not a real style tag`).toBe(true)
    })
  })
})
