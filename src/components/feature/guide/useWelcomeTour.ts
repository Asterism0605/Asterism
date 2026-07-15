import { ref } from 'vue';

export const WELCOME_TOUR_STORAGE_KEY = 'asterism:tour:welcome';
export const WELCOME_TOUR_HANDLED_VALUE = 'handled';

function readHandled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(WELCOME_TOUR_STORAGE_KEY) === WELCOME_TOUR_HANDLED_VALUE;
  } catch {
    return false;
  }
}

function persistHandled(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(WELCOME_TOUR_STORAGE_KEY, WELCOME_TOUR_HANDLED_VALUE);
  } catch {
    // Tour completion still applies for the current session when persistence is unavailable.
  }
}

function clearHandled(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(WELCOME_TOUR_STORAGE_KEY);
  } catch {
    // Reset still applies for the current session when persistence is unavailable.
  }
}

export function useWelcomeTour() {
  const isHandled = ref(readHandled());

  function complete(): void {
    isHandled.value = true;
    persistHandled();
  }

  function reset(): void {
    isHandled.value = false;
    clearHandled();
  }

  return {
    isHandled,
    complete,
    reset
  };
}
