import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUIDE_STORAGE_KEY,
  GUIDE_TARGET_INDEX
} from '@/components/feature/guide/constants';
import { useHomeImageGuide } from '@/components/feature/guide/useHomeImageGuide';

function appendGuideCandidate(index: number, rect: DOMRect): HTMLElement {
  const element = document.createElement('div');
  element.dataset.guideImageIndex = String(index);
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
});
