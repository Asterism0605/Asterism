import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import ScrambleText from '@/components/effects/ScrambleText.vue'
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue'
import StyleTagModal from '@/components/feature/dna/StyleTagModal.vue'
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
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the hero image and annotation values without the desktop score grid', () => {
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
    expect(hero.classes()).toContain('lg:h-[115vh]')
    expect(hero.classes()).toContain('lg:max-h-none')
    expect(hero.classes()).toContain('lg:translate-y-[200px]')
    const resultPanel = wrapper.get('.style-result-panel')
    expect(resultPanel.classes()).toContain('glass-panel')
    expect(resultPanel.classes()).toContain('top-[15rem]')
    expect(resultPanel.classes()).toContain('w-[9rem]')
    expect(resultPanel.classes()).toContain('lg:bottom-0')

    const normalizedText = wrapper.text().replace(/\s+/g, ' ')

    annotations.forEach((annotation) => {
      expect(normalizedText).toContain(annotation.label)
      expect(wrapper.text()).toContain(annotation.value)
    })

    expect(wrapper.find('.style-score-grid').exists()).toBe(false)
    styles.forEach((style) => {
      expect(normalizedText).not.toContain(style.label)
    })
    expect(wrapper.text()).not.toContain('Click to choose')
    expect(wrapper.text()).not.toContain('Your Style DNA')
  })

  it('renders each annotation with a horizontal line, bent tail, and text content below', () => {
    const wrapper = mount(StyleAnnotationDisplay, {
      props: {
        primaryStyle: 'Minimalism',
        heroImage: '/images/minimalism.png',
        styles,
        annotations,
      },
    })

    const annotationNodes = wrapper.findAll('[data-testid="style-annotation"]')
    expect(annotationNodes).toHaveLength(annotations.length)

    annotationNodes.forEach((annotationNode, index) => {
      annotationNode.get('.style-annotation__line')
      annotationNode.get('.style-annotation__tail')

      const content = annotationNode.get('.style-annotation__content')
      expect(content.text()).toContain(annotations[index].label)
      expect(content.text()).toContain(annotations[index].value)
    })

    const lowerTails = annotationNodes[1].findAll('.style-annotation__tail')
    expect(lowerTails).toHaveLength(2)
    expect(lowerTails[0].classes()).toContain('lg:block')
    expect(lowerTails[1].classes()).toContain('origin-left')
    expect(lowerTails[1].classes()).toContain('lg:hidden')
    expect(annotationNodes[0].classes()).toContain('left-[calc(-12vw-40px)]')
    expect(annotationNodes[0].classes()).not.toContain('sm:left-[6vw]')
    expect(annotationNodes[1].classes()).toContain('left-[calc(-2vw-30px)]')
  })

  it('does not render a decorative bottom line beneath the style score panel', () => {
    const wrapper = mount(StyleAnnotationDisplay, {
      props: {
        primaryStyle: 'Minimalism',
        heroImage: '/images/minimalism.png',
        styles,
        annotations,
      },
    })

    expect(wrapper.find('[data-testid="style-panel-bottom-line"]').exists()).toBe(false)
  })

  it('breaks two-word style labels onto separate display lines', () => {
    const twoWordAnnotations: StyleDnaAnnotation[] = [
      { ...annotations[0], label: 'Soft Tech' },
      ...annotations.slice(1),
    ]
    const wrapper = mount(StyleAnnotationDisplay, {
      props: {
        primaryStyle: 'Minimalism',
        heroImage: '/images/minimalism.png',
        styles,
        annotations: twoWordAnnotations,
      },
    })

    expect(wrapper.findComponent(ScrambleText).props('text')).toBe('Soft\nTech')
  })

  it('applies the scramble text effect to annotation tags in sequence', () => {
    const wrapper = mount(StyleAnnotationDisplay, {
      props: {
        primaryStyle: 'Minimalism',
        heroImage: '/images/minimalism.png',
        styles,
        annotations,
      },
    })

    const scrambleTexts = wrapper.findAllComponents(ScrambleText)
    expect(scrambleTexts).toHaveLength(annotations.length)
    expect(scrambleTexts.map((item) => item.props('text'))).toEqual(
      annotations.map((annotation) => annotation.label),
    )
    const delayByText = Object.fromEntries(
      scrambleTexts.map((item) => [item.props('text'), item.props('delay')]),
    )
    expect(delayByText).toEqual({
      Core: 0,
      Detail: 1.4,
      Accent: 2.8,
    })
    expect(scrambleTexts.every((item) => item.props('duration') === 1)).toBe(true)
  })

  it('opens the tag modal with the clicked annotation label', async () => {
    const wrapper = mount(StyleAnnotationDisplay, {
      props: {
        primaryStyle: 'Minimalism',
        heroImage: '/images/minimalism.png',
        styles,
        annotations,
      },
    })

    const firstAnnotationButton = wrapper
      .findAll('[data-testid="style-annotation"] [role="button"]')
      .at(0)
    await firstAnnotationButton?.trigger('click')

    const modal = wrapper.getComponent(StyleTagModal)
    expect(modal.props('modelValue')).toBe(true)
    expect(modal.props('tagLabel')).toBe(annotations[0].label)
  })

})
