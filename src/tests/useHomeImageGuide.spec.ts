import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUIDE_STORAGE_KEY,
  GUIDE_TARGET_INDEX
} from '@/components/feature/guide/constants/constants';
import { useHomeImageGuide } from '@/components/feature/guide/composables/useHomeImageGuide';
import { LAYOUT_PRESETS } from '@/components/sections/FloatingImageNetwork/config';

function appendGuideCandidate(
  index: number,
  rect: DOMRect,
  ready = true,
  failed = false
): HTMLElement {
  const element = document.createElement('div');
  element.dataset.guideImageIndex = String(index);
  if (ready) {
    element.dataset.guideImageReady = 'true';
  }
  if (failed) {
    element.dataset.guideImageError = 'true';
  }
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
  document.body.append(element);
  return element;
}

describe('useHomeImageGuide', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows the guide until it is completed and persists completion', () => {
    const guide = useHomeImageGuide();

    guide.startGuide();
    expect(guide.isVisible.value).toBe(true);

    guide.completeGuide();
    expect(guide.isVisible.value).toBe(false);
    expect(localStorage.getItem(GUIDE_STORAGE_KEY)).toBe('completed');

    const nextVisit = useHomeImageGuide();
    nextVisit.startGuide();
    expect(nextVisit.isVisible.value).toBe(false);
  });

  it('still closes the guide when storage access throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const guide = useHomeImageGuide();

    guide.startGuide();
    guide.completeGuide();

    expect(guide.isVisible.value).toBe(false);
  });

  it('restarts a previously completed guide', () => {
    localStorage.setItem('asterism:guide:home-image-click', 'completed');
    const guide = useHomeImageGuide();

    guide.restartGuide();

    expect(guide.isVisible.value).toBe(true);
    expect(localStorage.getItem('asterism:guide:home-image-click')).toBeNull();
  });

  it('prefers the configured target and falls back to the first visible card', () => {
    const fallback = appendGuideCandidate(
      1,
      new DOMRect(20, 20, 100, 100)
    );
    appendGuideCandidate(GUIDE_TARGET_INDEX, new DOMRect(0, 0, 0, 0));
    const guide = useHomeImageGuide();

    expect(guide.findTargetIndex()).toBe(1);

    fallback.remove();
    appendGuideCandidate(GUIDE_TARGET_INDEX, new DOMRect(50, 50, 100, 100));
    expect(guide.findTargetIndex()).toBe(GUIDE_TARGET_INDEX);
  });

  it('waits for a visible preferred target until its image is ready', () => {
    appendGuideCandidate(1, new DOMRect(20, 20, 100, 100));
    appendGuideCandidate(GUIDE_TARGET_INDEX, new DOMRect(50, 50, 100, 100), false);

    expect(useHomeImageGuide().findTargetIndex()).toBeNull();
  });

  it('uses the home hero anchor as the guide target', () => {
    expect(GUIDE_TARGET_INDEX).toBe(LAYOUT_PRESETS.home.homeHeroAnchor?.index);
  });

  it('falls back when the visible preferred target fails to load', () => {
    appendGuideCandidate(1, new DOMRect(20, 20, 100, 100));
    appendGuideCandidate(GUIDE_TARGET_INDEX, new DOMRect(50, 50, 100, 100), false, true);

    expect(useHomeImageGuide().findTargetIndex()).toBe(1);
  });
});
