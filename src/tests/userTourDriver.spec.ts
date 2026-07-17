import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUserTourDriver } from '@/services/guide/userTourDriver';

describe('createUserTourDriver', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a glass popover, arrow and shared Vue actions around the target', async () => {
    const target = document.createElement('button');
    target.dataset.tour = 'home-overview';
    document.body.append(target);
    const onPrevious = vi.fn();
    const onClose = vi.fn();
    const onNext = vi.fn();
    const tourDriver = createUserTourDriver();

    expect(
      tourDriver.show({
        target: '[data-tour="home-overview"]',
        title: '探索首頁',
        description: '每張圖片都可以展開探索。',
        progressLabel: '1 / 3',
        previousLabel: '上一步',
        nextLabel: '下一步',
        closeLabel: '關閉導覽',
        onPrevious,
        onClose,
        onNext
      })
    ).toBe(true);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const popover = document.querySelector('.asterism-tour-popover');
    const overlay = document.querySelector<SVGElement>('.driver-overlay');
    expect(popover).not.toBeNull();
    expect(overlay).not.toBeNull();
    expect(window.getComputedStyle(overlay as SVGElement).zIndex).toBe('900');
    expect(window.getComputedStyle(popover as Element).zIndex).toBe('902');
    expect(popover?.querySelector('.driver-popover-arrow')).not.toBeNull();
    expect(popover?.textContent).toContain('1 / 3');
    expect(popover?.textContent).toContain('探索首頁');
    expect(popover?.querySelector('.asterism-tour-popover__meta .driver-popover-progress-text'))
      .not.toBeNull();

    const previousButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="user-tour-previous"]'
    );
    const closeButton = document.querySelector<HTMLButtonElement>('[data-testid="user-tour-close"]');
    const nextButton = document.querySelector<HTMLButtonElement>('[data-testid="user-tour-next"]');
    nextButton?.click();
    previousButton?.click();
    closeButton?.click();

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);

    tourDriver.destroy();
    expect(document.querySelector('.asterism-tour-popover')).toBeNull();
  });

  it('does not activate when the target is missing', () => {
    const tourDriver = createUserTourDriver();

    expect(
      tourDriver.show({
        target: '[data-tour="missing"]',
        title: 'Missing',
        description: 'Missing target',
        progressLabel: '1 / 1',
        previousLabel: 'Previous',
        nextLabel: 'Next',
        closeLabel: 'Close tour',
        onPrevious: vi.fn(),
        onClose: vi.fn(),
        onNext: vi.fn()
      })
    ).toBe(false);
    expect(tourDriver.isActive()).toBe(false);
  });

  it('keeps the current popover open while pause confirmation is pending', () => {
    const target = document.createElement('button');
    document.body.append(target);
    const tourDriver = createUserTourDriver();

    tourDriver.show({
      target,
      title: 'Tour',
      description: 'Description',
      progressLabel: '1 / 8',
      previousLabel: 'Previous',
      nextLabel: 'Next',
      closeLabel: 'Close tour',
      onPrevious: vi.fn(),
      onClose: vi.fn()
    });

    document.querySelector<HTMLButtonElement>('[data-testid="user-tour-close"]')?.click();

    expect(tourDriver.isActive()).toBe(true);
    expect(document.querySelector('.asterism-tour-popover')).not.toBeNull();
  });

  it('shows the arrow for centered popovers', () => {
    const target = document.createElement('button');
    document.body.append(target);
    const tourDriver = createUserTourDriver();

    tourDriver.show({
      target,
      title: 'Tour',
      description: 'Description',
      progressLabel: '1 / 8',
      previousLabel: 'Previous',
      side: 'right',
      align: 'center',
      closeLabel: 'Close tour',
      onPrevious: vi.fn(),
      onClose: vi.fn()
    });

    const arrow = document.querySelector<HTMLElement>('.driver-popover-arrow');
    expect(arrow).not.toBeNull();
    expect(window.getComputedStyle(arrow as HTMLElement).display).not.toBe('none');
    expect(arrow?.style.width).toBe('');
    expect(arrow?.style.height).toBe('');
    expect(arrow?.style.transform).toBe('');
    expect(arrow?.className).toMatch(/driver-popover-arrow-side-(left|right|top|bottom)/);
  });

  it('spotlights multiple targets while keeping the popover centered', async () => {
    const rects = [
      new DOMRect(100, 120, 80, 24),
      new DOMRect(140, 420, 70, 24),
      new DOMRect(720, 150, 100, 24),
      new DOMRect(760, 460, 90, 24)
    ];
    const targets = rects.map((rect) => {
      const target = document.createElement('span');
      target.dataset.tourMediumLabel = '';
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect);
      document.body.append(target);
      return target;
    });
    const tourDriver = createUserTourDriver();

    tourDriver.show({
      target: targets[0],
      title: 'Mediums',
      description: 'Four Medium labels',
      progressLabel: '3 / 7',
      previousLabel: 'Previous',
      nextLabel: 'Next',
      closeLabel: 'Close tour',
      multiTargetSelector: '[data-tour-medium-label]',
      centerPopover: true,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onClose: vi.fn()
    });

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const overlayPath = document.querySelector<SVGPathElement>('.driver-overlay path');
    const popover = document.querySelector<HTMLElement>('.asterism-tour-popover');
    const arrow = popover?.querySelector<HTMLElement>('.driver-popover-arrow');
    expect(document.querySelectorAll('.asterism-tour-multi-highlight__outline')).toHaveLength(4);
    expect(overlayPath).not.toBeNull();
    expect(overlayPath?.getAttribute('d')?.match(/Q/g) ?? []).toHaveLength(16);
    expect(popover?.classList.contains('asterism-tour-popover--centered')).toBe(true);
    expect(arrow).not.toBeNull();
    expect(window.getComputedStyle(arrow as HTMLElement).display).toBe('none');

    window.dispatchEvent(new Event('scroll'));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(overlayPath?.getAttribute('d')?.match(/Q/g) ?? []).toHaveLength(16);

    tourDriver.destroy();
    expect(document.querySelector('.asterism-tour-multi-highlight')).toBeNull();
  });

  it('refreshes the spotlight while its target is animating', async () => {
    const target = document.createElement('button');
    const rect = vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 100, 200, 300)
    );
    document.body.append(target);
    const tourDriver = createUserTourDriver();

    tourDriver.show({
      target,
      title: 'Tour',
      description: 'Description',
      progressLabel: '5 / 7',
      previousLabel: 'Previous',
      closeLabel: 'Close tour',
      onPrevious: vi.fn(),
      onClose: vi.fn()
    });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const callsBeforeAnimation = rect.mock.calls.length;

    target.dispatchEvent(new Event('animationstart'));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    target.dispatchEvent(new Event('animationend'));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(rect.mock.calls.length).toBeGreaterThan(callsBeforeAnimation);
  });
});
