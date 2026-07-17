import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

export const WELCOME_TOUR_STORAGE_KEY = 'asterism:tour:welcome';
export const WELCOME_TOUR_HANDLED_VALUE = 'handled';

function getStorageKey(userId?: string | null): string {
  return userId ? `${WELCOME_TOUR_STORAGE_KEY}:${userId}` : WELCOME_TOUR_STORAGE_KEY;
}

function readHandled(userId?: string | null): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const key = getStorageKey(userId);
    if (window.localStorage.getItem(key) === WELCOME_TOUR_HANDLED_VALUE) return true;

    if (
      userId &&
      window.localStorage.getItem(WELCOME_TOUR_STORAGE_KEY) === WELCOME_TOUR_HANDLED_VALUE
    ) {
      window.localStorage.setItem(key, WELCOME_TOUR_HANDLED_VALUE);
      window.localStorage.removeItem(WELCOME_TOUR_STORAGE_KEY);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function persistHandled(userId?: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), WELCOME_TOUR_HANDLED_VALUE);
  } catch {
    // Tour completion still applies for the current session when persistence is unavailable.
  }
}

function clearHandled(userId?: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(getStorageKey(userId));
  } catch {
    // Reset still applies for the current session when persistence is unavailable.
  }
}

export function useWelcomeTour(userId?: MaybeRefOrGetter<string | null | undefined>) {
  const isHandled = ref(readHandled(toValue(userId)));

  function complete(): void {
    isHandled.value = true;
    persistHandled(toValue(userId));
  }

  function reset(): void {
    isHandled.value = false;
    clearHandled(toValue(userId));
  }

  if (userId !== undefined) {
    watch(
      () => toValue(userId),
      (nextUserId) => {
        isHandled.value = readHandled(nextUserId);
      }
    );
  }

  return {
    isHandled,
    complete,
    reset
  };
}
