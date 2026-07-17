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
    const onPause = vi.fn();
    const onNext = vi.fn();
    const tourDriver = createUserTourDriver();

    expect(
      tourDriver.show({
        target: '[data-tour="home-overview"]',
        title: '探索首頁',
        description: '每張圖片都可以展開探索。',
        sectionLabel: '首頁導覽',
        progressLabel: '1 / 3',
        pauseLabel: '暫停',
        nextLabel: '下一步',
        onPause,
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
    expect(popover?.textContent).toContain('首頁導覽');
    expect(popover?.textContent).toContain('探索首頁');

    const pauseButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="user-tour-pause"]'
    );
    const nextButton = document.querySelector<HTMLButtonElement>('[data-testid="user-tour-next"]');
    nextButton?.click();
    pauseButton?.click();

    expect(onPause).toHaveBeenCalledTimes(1);
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
        sectionLabel: 'Tour',
        progressLabel: '1 / 1',
        pauseLabel: 'Pause',
        nextLabel: 'Next',
        onPause: vi.fn(),
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
      sectionLabel: 'Section',
      progressLabel: '1 / 8',
      pauseLabel: 'Pause',
      nextLabel: 'Next',
      onPause: vi.fn()
    });

    document.querySelector<HTMLButtonElement>('[data-testid="user-tour-pause"]')?.click();

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
      sectionLabel: 'Section',
      progressLabel: '1 / 8',
      pauseLabel: 'Pause',
      side: 'right',
      align: 'center',
      onPause: vi.fn()
    });

    const arrow = document.querySelector<HTMLElement>('.driver-popover-arrow');
    expect(arrow).not.toBeNull();
    expect(window.getComputedStyle(arrow as HTMLElement).display).not.toBe('none');
    expect(arrow?.style.width).toBe('');
    expect(arrow?.style.height).toBe('');
    expect(arrow?.style.transform).toBe('');
    expect(arrow?.className).toMatch(/driver-popover-arrow-side-(left|right|top|bottom)/);
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
      sectionLabel: 'Section',
      progressLabel: '5 / 8',
      pauseLabel: 'Pause',
      onPause: vi.fn()
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
