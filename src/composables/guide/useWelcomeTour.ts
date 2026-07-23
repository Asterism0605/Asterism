import { getCurrentInstance, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

export const WELCOME_TOUR_STORAGE_KEY = 'asterism:tour:welcome';
export const WELCOME_TOUR_HANDLED_VALUE = 'handled';
const WELCOME_TOUR_STATE_EVENT = 'asterism:welcome-tour-state-change';

interface WelcomeTourStateChange {
  userId: string | null;
  isHandled: boolean;
}

function getStorageKey(userId?: string | null): string {
  return userId ? `${WELCOME_TOUR_STORAGE_KEY}:${userId}` : WELCOME_TOUR_STORAGE_KEY;
}

function readHandled(userId?: string | null): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const key = getStorageKey(userId);
    return window.localStorage.getItem(key) === WELCOME_TOUR_HANDLED_VALUE;
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
  const currentInstance = getCurrentInstance();

  const handleExternalStateChange = (event: Event): void => {
    const detail = (event as CustomEvent<Partial<WelcomeTourStateChange>>).detail;
    const currentUserId = toValue(userId) ?? null;

    if (
      (detail?.userId ?? null) === currentUserId &&
      typeof detail?.isHandled === 'boolean'
    ) {
      isHandled.value = detail.isHandled;
    }
  };

  if (currentInstance && typeof window !== 'undefined') {
    window.addEventListener(WELCOME_TOUR_STATE_EVENT, handleExternalStateChange);
    onBeforeUnmount(() => {
      window.removeEventListener(WELCOME_TOUR_STATE_EVENT, handleExternalStateChange);
    });
  }

  function notifyStateChange(nextIsHandled: boolean): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent(WELCOME_TOUR_STATE_EVENT, {
        detail: {
          userId: toValue(userId) ?? null,
          isHandled: nextIsHandled
        } satisfies WelcomeTourStateChange
      })
    );
  }

  function complete(): void {
    isHandled.value = true;
    persistHandled(toValue(userId));
    notifyStateChange(true);
  }

  function reset(): void {
    isHandled.value = false;
    clearHandled(toValue(userId));
    notifyStateChange(false);
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
