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

function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Guide persistence is optional; the current session can still restart it.
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

  function restartGuide(): void {
    removeStorageItem(GUIDE_STORAGE_KEY);
    startGuide();
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
    if (preferred && preferred.dataset.guideImageError !== 'true') {
      return preferred.dataset.guideImageReady === 'true'
        ? Number(preferred.dataset.guideImageIndex)
        : null;
    }

    const fallback = candidates.find((element) => element.dataset.guideImageReady === 'true');

    return fallback ? Number(fallback.dataset.guideImageIndex) : null;
  }

  return {
    isVisible,
    startGuide,
    restartGuide,
    completeGuide,
    findTargetIndex
  };
}
