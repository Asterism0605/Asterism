const STORAGE_KEY = 'asterism:pending-moodboard-action';
const MAX_AGE_MS = 30 * 60 * 1000;

interface PendingMoodboardAction {
  type: 'open-save-menu';
  imageId: string;
  returnTo: string;
  createdAt: number;
}

export type PendingMoodboardActionResult = 'ready' | 'discarded' | null;

export function savePendingMoodboardAction(imageId: string, returnTo: string): void {
  const action: PendingMoodboardAction = {
    type: 'open-save-menu',
    imageId,
    returnTo,
    createdAt: Date.now()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(action));
  } catch {
    // Redirect still works when browser storage is unavailable.
  }
}

export function consumePendingMoodboardAction(imageId: string): PendingMoodboardActionResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const action = JSON.parse(raw) as Partial<PendingMoodboardAction>;
    const age = Date.now() - (action.createdAt ?? 0);
    const isValid =
      action.type === 'open-save-menu' &&
      typeof action.imageId === 'string' &&
      typeof action.returnTo === 'string' &&
      age >= 0 &&
      age <= MAX_AGE_MS;

    if (!isValid) {
      localStorage.removeItem(STORAGE_KEY);
      return 'discarded';
    }

    if (action.imageId !== imageId) return null;

    localStorage.removeItem(STORAGE_KEY);
    return 'ready';
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage is unavailable; there is nothing else to recover.
    }
    return 'discarded';
  }
}
