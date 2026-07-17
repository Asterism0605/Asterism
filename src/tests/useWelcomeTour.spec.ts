import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWelcomeTour } from '@/components/feature/guide/composables/useWelcomeTour';

describe('useWelcomeTour', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts unhandled and persists completion', () => {
    const tour = useWelcomeTour();

    expect(tour.isHandled.value).toBe(false);

    tour.complete();

    expect(tour.isHandled.value).toBe(true);
    expect(localStorage.getItem('asterism:tour:welcome')).toBe('handled');
    expect(useWelcomeTour().isHandled.value).toBe(true);
  });

  it('resets a completed tour', () => {
    const tour = useWelcomeTour();
    tour.complete();

    tour.reset();

    expect(tour.isHandled.value).toBe(false);
    expect(localStorage.getItem('asterism:tour:welcome')).toBeNull();
  });

  it('keeps the handled state isolated between authenticated users', () => {
    const firstUser = useWelcomeTour('user-a');
    firstUser.complete();

    expect(firstUser.isHandled.value).toBe(true);
    expect(useWelcomeTour('user-b').isHandled.value).toBe(false);
    expect(localStorage.getItem('asterism:tour:welcome:user-a')).toBe('handled');
  });

  it('keeps the current session usable when storage access fails', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const tour = useWelcomeTour();
    tour.complete();
    tour.reset();

    expect(tour.isHandled.value).toBe(false);
  });
});
