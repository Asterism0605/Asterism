import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue'
import type { ImageSpreadNode } from '@/types/image'

const images: ImageSpreadNode[] = [
  'Graphic Design',
  'Outfit',
  'Interior Design',
  'Architecture'
].map((medium, index) => ({
  id: `image-${index}`,
  src: `/image-${index}.webp`,
  alt: medium,
  title: medium,
  styleGroup: 'style-group',
  style: [],
  medium,
  colorPalette: []
}))

describe('RelatedImageCluster', () => {
  it('marks all four desktop Medium labels as tour targets', () => {
    const wrapper = mount(RelatedImageCluster, {
      props: {
        images,
        getImageLabel: (image) => image.medium
      }
    })

    expect(wrapper.findAll('[data-tour-medium-label]')).toHaveLength(4)

    wrapper.unmount()
  })
})
