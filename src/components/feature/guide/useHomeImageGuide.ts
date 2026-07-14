import { ref } from 'vue';
import { GUIDE_STORAGE_KEY, GUIDE_TARGET_INDEX } from './constants';

const GUIDE_COMPLETED_VALUE = 'completed';

function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Guide persistence is optional; the current session can still close it.
  }
}

function isVisibleCandidate(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > 0 &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.top < window.innerHeight
  );
}

export function useHomeImageGuide() {
  const isVisible = ref(false);

  function startGuide(): void {
    isVisible.value = getStorageItem(GUIDE_STORAGE_KEY) !== GUIDE_COMPLETED_VALUE;
  }

  function completeGuide(): void {
    isVisible.value = false;
    setStorageItem(GUIDE_STORAGE_KEY, GUIDE_COMPLETED_VALUE);
  }

  function findTargetIndex(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('[data-guide-image-index]')
    ).filter(isVisibleCandidate);
    const preferred = candidates.find(
      (element) => Number(element.dataset.guideImageIndex) === GUIDE_TARGET_INDEX
    );
    const target = preferred ?? candidates[0];

    return target ? Number(target.dataset.guideImageIndex) : null;
  }

  return {
    isVisible,
    startGuide,
    completeGuide,
    findTargetIndex
  };
}
