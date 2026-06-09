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

  it('renders home layout image cards at fixed positions immediately', () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: mockImages, layout: 'home' }
    });

    const cards = wrapper.findAll('[data-testid="image-card"]');

    expect(cards.length).toBe(3);
    expect(cards[0].classes()).toContain('image-card--home');
    expect(cards[0].attributes('style')).toContain('left: 13%');
    expect(cards[0].attributes('style')).not.toContain('left: 0px');
    expect(cards[0].attributes('style')).toContain('opacity: 1');
  });

  it('still limits home layout images to six items', () => {
    const sevenImages = Array.from({ length: 7 }, (_, i) => ({
      src: `/img${i}.jpg`,
      alt: `image ${i}`
    }));
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: sevenImages, layout: 'home' }
    });

    expect(wrapper.findAll('[data-testid="image-card"]').length).toBe(6);
  });

  it('activates each constellation background after its own image hover', async () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: mockImages, layout: 'home', showConstellations: true }
    });

    const constellations = wrapper.findAll('[data-testid="image-constellation"]');
    const cards = wrapper.findAll('[data-testid="image-card"]');

    expect(constellations.length).toBe(mockImages.length);

    for (const constellation of constellations) {
      expect(constellation.classes()).not.toContain('is-active');
    }

    for (const [index, card] of cards.entries()) {
      await card.trigger('mouseenter');

      expect(wrapper.findAll('[data-testid="image-constellation"]')[index].classes()).toContain(
        'is-active'
      );

      await card.trigger('mouseleave');

      expect(wrapper.findAll('[data-testid="image-constellation"]')[index].classes()).not.toContain(
        'is-active'
      );
    }
  });

  it('keeps home card positioning on the outer card and floats only inner content', () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: mockImages, layout: 'home', showConstellations: true }
    });

    const card = wrapper.find('[data-testid="image-card"]');

    expect(card.classes()).toContain('image-card--home');
    expect(card.find('.image-card__float').exists()).toBe(true);
  });
});
