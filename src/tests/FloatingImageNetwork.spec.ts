import { mount } from '@vue/test-utils';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork';
import { applyAvoidAreas } from '@/components/sections/FloatingImageNetwork/avoidance';
import {
  buildFloatingImageLayout,
  resolveLayoutPreset
} from '@/components/sections/FloatingImageNetwork/layout';

const mockImages = [
  { src: '/img1.jpg', alt: 'image 1' },
  { src: '/img2.jpg', alt: 'image 2' },
  { src: '/img3.jpg', alt: 'image 3' }
];

function setContainerSize(width: number, height: number) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => width
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => height
  });
  Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => width
  });
  Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => height
  });
}

function getNodeHeight(width: number, aspect: string) {
  const [aspectWidth, aspectHeight] = aspect.split('/').map(Number);
  return width / (aspectWidth / aspectHeight);
}

function overlapsTitleArea(node: { x: number; y: number; width: number; aspect: string }) {
  const nodeHeight = getNodeHeight(node.width, node.aspect);
  const nodeRect = {
    left: node.x - node.width / 2,
    top: node.y - nodeHeight / 2,
    right: node.x + node.width / 2,
    bottom: node.y + nodeHeight / 2
  };
  const titleRect = {
    left: 0,
    top: 900 * 0.14,
    right: 1200 * 0.62,
    bottom: 900 * 0.32
  };

  return (
    nodeRect.left < titleRect.right &&
    nodeRect.right > titleRect.left &&
    nodeRect.top < titleRect.bottom &&
    nodeRect.bottom > titleRect.top
  );
}

describe('FloatingImageNetwork', () => {
  beforeEach(() => {
    setContainerSize(1200, 900);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('renders generated home layout image cards without fixed template coordinates', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.15)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.35)
      .mockReturnValueOnce(0.45)
      .mockReturnValueOnce(0.55);

    const wrapper = mount(FloatingImageNetwork, {
      attachTo: document.body,
      props: { images: mockImages, layout: 'home' }
    });
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('[data-testid="image-card"]');
    const firstStyle = cards[0].attributes('style');

    expect(cards.length).toBe(3);
    expect(cards[0].classes()).toContain('image-card--home');
    expect(firstStyle).toContain('left:');
    expect(firstStyle).toContain('top:');
    expect(firstStyle).not.toContain('left: 13%');
    expect(firstStyle).not.toContain('top: 9%');
    expect(firstStyle).toContain('opacity: 1');
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
      attachTo: document.body,
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
      attachTo: document.body,
      props: { images: mockImages, layout: 'home', showConstellations: true }
    });

    const card = wrapper.find('[data-testid="image-card"]');

    expect(card.classes()).toContain('image-card--home');
    expect(card.find('.image-card__float').exists()).toBe(true);
  });

  it('generates a fresh home layout on each mount', async () => {
    const firstRandom = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.15)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.35)
      .mockReturnValueOnce(0.45)
      .mockReturnValueOnce(0.55);

    const firstWrapper = mount(FloatingImageNetwork, {
      attachTo: document.body,
      props: { images: mockImages, layout: 'home' }
    });
    await firstWrapper.vm.$nextTick();
    const firstStyle = firstWrapper.findAll('[data-testid="image-card"]')[0].attributes('style');

    firstWrapper.unmount();
    firstRandom.mockRestore();

    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.85)
      .mockReturnValueOnce(0.75)
      .mockReturnValueOnce(0.65)
      .mockReturnValueOnce(0.55)
      .mockReturnValueOnce(0.45)
      .mockReturnValueOnce(0.35);

    const secondWrapper = mount(FloatingImageNetwork, {
      attachTo: document.body,
      props: { images: mockImages, layout: 'home' }
    });
    await secondWrapper.vm.$nextTick();
    const secondStyle = secondWrapper.findAll('[data-testid="image-card"]')[0].attributes('style');

    expect(firstStyle).not.toEqual(secondStyle);
  });

  it('keeps generated home layout image cards out of the h1 title area', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const positions = buildFloatingImageLayout(6, 1200, 900, resolveLayoutPreset('home'));

    expect(positions.some(overlapsTitleArea)).toBe(false);
  });

  it('keeps right-side mobile cards from over-avoiding the title row', () => {
    const [position] = applyAvoidAreas(
      [{ x: 300, y: 150, width: 96, aspect: '1/1' }],
      360,
      900,
      resolveLayoutPreset('home').avoidAreas
    );

    expect(position).toEqual({ x: 300, y: 150, width: 96, aspect: '1/1' });
  });
});
