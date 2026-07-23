import { mount } from '@vue/test-utils';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork';
import { applyAvoidAreas } from '@/components/sections/FloatingImageNetwork/avoidance';
import * as floatingImageLayout from '@/components/sections/FloatingImageNetwork/layout';
import {
  buildFloatingImageLayout,
  reflowFloatingImageLayout,
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

function getNodeRect(node: { x: number; y: number; width: number; aspect: string }) {
  const height = getNodeHeight(node.width, node.aspect);

  return {
    ...node,
    left: node.x - node.width / 2,
    right: node.x + node.width / 2,
    top: node.y - height / 2,
    bottom: node.y + height / 2
  };
}

function overlaps(a: ReturnType<typeof getNodeRect>, b: ReturnType<typeof getNodeRect>) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function overlapsTitleArea(node: { x: number; y: number; width: number; aspect: string }) {
  const nodeHeight = getNodeHeight(node.width, node.aspect);
  const nodeRect = {
    left: node.x - node.width / 2,
    top: node.y - nodeHeight / 2,
    right: node.x + node.width / 2,
    bottom: node.y + nodeHeight / 2
  };
  // 標題避讓區改成相對第一個 viewport（0.28~0.64），對應 Home.vue 的 pt-40vh 標題位置
  const titleRect = {
    left: 0,
    top: 900 * 0.28,
    right: 1200 * 0.62,
    bottom: 900 * 0.64
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

  it('emits ready after every image has loaded', async () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });

    for (const image of wrapper.findAll('img')) {
      const element = image.element as HTMLImageElement;
      Object.defineProperty(element, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(element, 'naturalHeight', { value: 600, configurable: true });
      await image.trigger('load');
    }

    expect(wrapper.emitted('ready')).toHaveLength(1);
  });

  it('sets correct src and alt on each img', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });
    const imgs = wrapper.findAll('img');
    expect(imgs[0].attributes('src')).toBe('/img1.jpg');
    expect(imgs[0].attributes('alt')).toBe('image 1');
    expect(imgs[1].attributes('src')).toBe('/img2.jpg');
  });

  it('falls back to the original image when a preview thumbnail fails, without re-looping', async () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: {
        images: [
          {
            src: '/style-image/preview/pic-480.webp',
            srcset: '/style-image/preview/pic-480.webp 480w, /style-image/preview/pic-720.webp 720w',
            fallbackSrc: '/style-image/pic.webp',
            alt: 'pic'
          }
        ]
      }
    });

    const img = wrapper.find('img');
    expect(img.attributes('src')).toBe('/style-image/preview/pic-480.webp');
    expect(img.attributes('srcset')).toBeTruthy();

    // 縮圖失敗：改載原圖、切掉 srcset，且此時還不算「失敗」（等原圖再試）。
    await img.trigger('error');
    expect(img.attributes('src')).toBe('/style-image/pic.webp');
    expect(img.attributes('srcset')).toBeUndefined();
    expect(wrapper.find('[data-testid="image-card"]').attributes('data-guide-image-error')).toBeUndefined();

    // 原圖也失敗：不再 fallback（src 維持原圖），此時才標記失敗。
    await img.trigger('error');
    expect(img.attributes('src')).toBe('/style-image/pic.webp');
    expect(wrapper.find('[data-testid="image-card"]').attributes('data-guide-image-error')).toBe('true');
  });

  it('renders all provided images without a hardcoded cap', () => {
    const sevenImages = Array.from({ length: 7 }, (_, i) => ({
      src: `/img${i}.jpg`,
      alt: `image ${i}`
    }));
    const wrapper = mount(FloatingImageNetwork, { props: { images: sevenImages } });
    expect(wrapper.findAll('img').length).toBe(7);
  });

  it('emits click event with image index when image card is clicked', async () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });

    await wrapper.findAll('[data-testid="image-card"]')[0].trigger('click');
    expect(wrapper.emitted('click')![0]).toEqual([0]);

    await wrapper.findAll('[data-testid="image-card"]')[1].trigger('click');
    expect(wrapper.emitted('click')![1]).toEqual([1]);
  });

  it('marks only the requested image card as the guide target', () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: mockImages, guideTargetIndex: 1 }
    });

    const cards = wrapper.findAll('[data-testid="image-card"]');

    expect(cards[0].attributes('data-guide-image-index')).toBe('0');
    expect(cards[1].attributes('data-guide-image-index')).toBe('1');
    expect(cards[1].attributes('data-guide-target')).toBe('true');
    expect(cards[1].classes()).toContain('image-card--guide-target');
    expect(cards[0].attributes('data-guide-target')).toBeUndefined();
    expect(cards[2].classes()).not.toContain('image-card--guide-target');
  });

  it('allows only the guide target to emit a click while the guide is active', async () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: mockImages, guideTargetIndex: 1 }
    });

    const cards = wrapper.findAll('[data-testid="image-card"]');
    await cards[0].trigger('click');
    await cards[1].trigger('click');
    await cards[2].trigger('click');

    expect(wrapper.emitted('click')).toEqual([[1]]);
    expect(cards[0].attributes('aria-disabled')).toBe('true');
    expect(cards[1].attributes('aria-disabled')).toBeUndefined();
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

    // 觸發圖片載入，讓卡片從隱藏淡入（isReady=true）
    for (const img of wrapper.findAll('img')) {
      const el = img.element as HTMLImageElement;
      Object.defineProperty(el, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(el, 'naturalHeight', { value: 600, configurable: true });
      await img.trigger('load');
    }
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

  it('does not re-shuffle visible cards after all images have loaded', async () => {
    vi.useFakeTimers();
    // 每次呼叫回傳不同值：若載入完成後又重算一次，位置就會變、Math.random 會被再呼叫。
    let seed = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      seed += 0.137;
      return seed % 1;
    });

    try {
      const wrapper = mount(FloatingImageNetwork, {
        attachTo: document.body,
        props: { images: mockImages, layout: 'home' }
      });
      await wrapper.vm.$nextTick();

      // 觸發全部圖片載入 -> isReady=true，卡片淡入定位
      for (const img of wrapper.findAll('img')) {
        const el = img.element as HTMLImageElement;
        Object.defineProperty(el, 'naturalWidth', { value: 800, configurable: true });
        Object.defineProperty(el, 'naturalHeight', { value: 600, configurable: true });
        await img.trigger('load');
      }
      await wrapper.vm.$nextTick();

      const styleAfterLoad = wrapper.findAll('[data-testid="image-card"]')[0].attributes('style');
      const randomCallsAfterLoad = random.mock.calls.length;

      // 卡片已顯示後，1 秒後備計時器不該再重算一次隨機排版（否則畫面會二次跳動）
      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();

      const styleAfterTimer = wrapper.findAll('[data-testid="image-card"]')[0].attributes('style');
      expect(random.mock.calls.length).toBe(randomCallsAfterLoad);
      expect(styleAfterTimer).toBe(styleAfterLoad);

      wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels a pending recompute when fallback makes the layout ready', async () => {
    vi.useFakeTimers();
    const build = vi.spyOn(floatingImageLayout, 'buildFloatingImageLayout');

    try {
      const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });
      await wrapper.vm.$nextTick();
      vi.advanceTimersByTime(950);

      const firstImage = wrapper.find('img');
      const element = firstImage.element as HTMLImageElement;
      Object.defineProperty(element, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(element, 'naturalHeight', { value: 600, configurable: true });
      await firstImage.trigger('load');

      vi.advanceTimersByTime(50);
      const callsAfterReady = build.mock.calls.length;
      vi.advanceTimersByTime(120);

      expect(build).toHaveBeenCalledTimes(callsAfterReady);
      wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('emits ready on fallback but waits for every image before images-loaded', async () => {
    vi.useFakeTimers();

    try {
      const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } });
      await wrapper.vm.$nextTick();

      vi.advanceTimersByTime(1000);
      expect(wrapper.emitted('ready')).toHaveLength(1);
      expect(wrapper.emitted('imagesLoaded')).toBeUndefined();

      for (const image of wrapper.findAll('img')) {
        await image.trigger('load');
      }

      expect(wrapper.emitted('ready')).toHaveLength(1);
      expect(wrapper.emitted('imagesLoaded')).toHaveLength(1);
      wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('makes the guide target available when other images fail or remain pending', async () => {
    vi.useFakeTimers();
    const images = Array.from({ length: 6 }, (_, index) => ({
      src: `/img${index}.jpg`,
      alt: `image ${index}`
    }));

    try {
      const wrapper = mount(FloatingImageNetwork, { props: { images } });
      await wrapper.vm.$nextTick();
      vi.advanceTimersByTime(1000);

      await wrapper.findAll('img')[1].trigger('error');
      const target = wrapper.findAll('img')[5];
      const element = target.element as HTMLImageElement;
      Object.defineProperty(element, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(element, 'naturalHeight', { value: 600, configurable: true });
      await target.trigger('load');
      vi.advanceTimersByTime(120);

      expect(wrapper.emitted('guideTargetReady')?.length).toBeGreaterThan(0);
      expect(wrapper.emitted('imagesLoaded')).toBeUndefined();
      wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reflows lazy image positions after fallback ready without re-shuffling cards', async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    const reflow = vi.spyOn(floatingImageLayout, 'reflowFloatingImageLayout');
    let seed = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      seed += 0.137;
      return seed % 1;
    });

    try {
      const wrapper = mount(FloatingImageNetwork, {
        attachTo: document.body,
        props: { images: mockImages.slice(0, 2), layout: 'home' }
      });
      await wrapper.vm.$nextTick();

      const imgs = wrapper.findAll('img');
      expect(imgs[0].attributes('loading')).toBe('eager');
      expect(imgs[0].attributes('fetchpriority')).toBe('high');
      expect(imgs[1].attributes('loading')).toBe('lazy');
      expect(imgs[1].attributes('fetchpriority')).toBe('auto');
      expect(imgs[1].attributes('decoding')).toBe('async');

      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();

      const randomCallsAfterReady = random.mock.calls.length;

      const lazyImage = imgs[1];
      const el = lazyImage.element as HTMLImageElement;
      Object.defineProperty(el, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(el, 'naturalHeight', { value: 1000, configurable: true });
      await lazyImage.trigger('load');
      vi.advanceTimersByTime(120);
      await wrapper.vm.$nextTick();

      expect(random.mock.calls.length).toBe(randomCallsAfterReady);
      expect(reflow).toHaveBeenCalledOnce();

      wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reflows existing positions for a changed aspect without generating random coordinates', () => {
    const random = vi.spyOn(Math, 'random');
    const positions = [
      { x: 1000, y: 300, width: 240, aspect: '3/4' },
      { x: 600, y: 620, width: 240, aspect: '16/10' }
    ];
    const randomCallsBeforeReflow = random.mock.calls.length;

    const reflowed = reflowFloatingImageLayout(
      positions,
      1200,
      900,
      resolveLayoutPreset('home'),
      900,
      [undefined, '4/5']
    );

    expect(random.mock.calls.length).toBe(randomCallsBeforeReflow);
    expect(reflowed).not.toEqual(positions);
    expect(overlaps(getNodeRect(reflowed[0]), getNodeRect(reflowed[1]))).toBe(false);
    expect(reflowed.some(overlapsTitleArea)).toBe(false);
  });

  it('renders all home layout images without a hardcoded cap', () => {
    const sevenImages = Array.from({ length: 7 }, (_, i) => ({
      src: `/img${i}.jpg`,
      alt: `image ${i}`
    }));
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: sevenImages, layout: 'home' }
    });

    expect(wrapper.findAll('[data-testid="image-card"]').length).toBe(7);
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
    // 稀疏版面（6 張、3000px 容器、viewport 900）+ 真實圖片比例下，
    // 標題帶（第一個 viewport）不該被卡片壓到
    const aspects = ['1122/1402', '1536/1024', '3/4', '1402/1122', '4/3', '1/1'];
    const positions = buildFloatingImageLayout(6, 1200, 3000, resolveLayoutPreset('home'), 900, aspects);

    expect(positions.some(overlapsTitleArea)).toBe(false);
  });

  it('keeps right-side mobile cards from over-avoiding the title row', () => {
    const [position] = applyAvoidAreas(
      [{ x: 300, y: 150, width: 96, aspect: '1/1' }],
      360,
      900,
      resolveLayoutPreset('home').avoidAreas,
      900
    );

    expect(position).toEqual({ x: 300, y: 150, width: 96, aspect: '1/1' });
  });

  it('renders every provided image without a hardcoded cap', () => {
    const manyImages = Array.from({ length: 45 }, (_, i) => ({
      src: `/img-${i}.webp`,
      alt: `img ${i}`
    }));
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: manyImages, layout: 'home' },
      global: { stubs: { ConstellationBackground: true } }
    });

    expect(wrapper.findAll('[data-testid="image-card"]')).toHaveLength(45);
  });
});
