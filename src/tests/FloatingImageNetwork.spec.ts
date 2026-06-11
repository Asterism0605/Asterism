import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork.vue';

const mockImages = [
  { src: '/img1.jpg', alt: 'image 1' },
  { src: '/img2.jpg', alt: 'image 2' },
  { src: '/img3.jpg', alt: 'image 3' }
];

describe('FloatingImageNetwork', () => {
  it('renders without errors with empty images array', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: [] } });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders correct number of img elements', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });
    expect(wrapper.findAll('img').length).toBe(3);
  });

  it('sets correct src and alt on each img', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });
    const imgs = wrapper.findAll('img');
    expect(imgs[0].attributes('src')).toBe('/img1.jpg');
    expect(imgs[0].attributes('alt')).toBe('image 1');
    expect(imgs[1].attributes('src')).toBe('/img2.jpg');
  });

  it('ignores images beyond index 5 (max 6)', () => {
    const sevenImages = Array.from({ length: 7 }, (_, i) => ({
      src: `/img${i}.jpg`,
      alt: `image ${i}`
    }));
    const wrapper = mount(FloatingImageNetwork, { props: { images: sevenImages } });
    expect(wrapper.findAll('img').length).toBe(6);
  });

  it('emits click event with image index when image card is clicked', async () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });

    await wrapper.findAll('[data-testid="image-card"]')[0].trigger('click');
    expect(wrapper.emitted('click')![0]).toEqual([0]);

    await wrapper.findAll('[data-testid="image-card"]')[1].trigger('click');
    expect(wrapper.emitted('click')![1]).toEqual([1]);
  });

  it('renders ambient dots behind the image cards', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });
    expect(wrapper.findAll('[data-testid="ambient-dot"]').length).toBeGreaterThan(0);
  });
});
