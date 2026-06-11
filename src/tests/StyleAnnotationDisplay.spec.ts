import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue'
import type { StyleDnaAnnotation, StyleDnaScore } from '@/utils/computeStyleDnaResult'

const styles: StyleDnaScore[] = [
  { label: 'Minimalism', percentage: 62 },
  { label: 'Soft Tech', percentage: 28 },
  { label: 'Editorial', percentage: 10 },
]

const annotations: StyleDnaAnnotation[] = [
  { label: 'Core', value: '62%', position: 'left' },
  { label: 'Accent', value: '28%', position: 'right' },
  { label: 'Detail', value: '10%', position: 'top-right' },
]

describe('StyleAnnotationDisplay', () => {
  it('renders the hero image, style scores, and annotation values', () => {
    const wrapper = mount(StyleAnnotationDisplay, {
      props: {
        primaryStyle: 'Minimalism',
        heroImage: '/images/minimalism.png',
        styles,
        annotations,
      },
    })

    const hero = wrapper.get('img')
    expect(hero.attributes('src')).toBe('/images/minimalism.png')
    expect(hero.attributes('alt')).toContain('Minimalism')

    styles.forEach((style) => {
      expect(wrapper.text()).toContain(style.label)
      expect(wrapper.text()).toContain(`${style.percentage}%`)
    })

    annotations.forEach((annotation) => {
      expect(wrapper.text()).toContain(annotation.label)
      expect(wrapper.text()).toContain(annotation.value)
    })

    expect(wrapper.text()).not.toContain('Click to choose')
    expect(wrapper.text()).not.toContain('Your Style DNA')
  })
})
