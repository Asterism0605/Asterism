import { beforeEach, describe, expect, it } from 'vitest';
import {
  getUserTourStorageKey,
  useUserTour
} from '@/composables/guide/useUserTour';

describe('useUserTour', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a paused step per authenticated user and resumes it', () => {
    const tour = useUserTour('user-a');

    tour.start('image-42');
    tour.advance('spread-center');
    tour.pause();

    expect(tour.state.value).toMatchObject({
      enabled: true,
      status: 'paused',
      step: 'spread-center',
      targetImageId: 'image-42'
    });

    const restored = useUserTour('user-a');
    restored.resume();

    expect(restored.state.value.status).toBe('active');
    expect(restored.state.value.step).toBe('spread-center');
    expect(useUserTour('user-b').state.value.status).toBe('idle');
  });

  it('opts out without marking the tour complete and only restart clears progress', () => {
    const tour = useUserTour('user-a');

    tour.start('image-42');
    tour.advance('detail-style-tag');
    tour.pause();
    tour.setEnabled(false);

    expect(tour.state.value).toMatchObject({
      enabled: false,
      status: 'paused',
      step: 'detail-style-tag'
    });

    tour.restart('image-99');

    expect(tour.state.value).toMatchObject({
      enabled: true,
      status: 'active',
      step: 'home-overview',
      targetImageId: 'image-99'
    });
  });

  it('falls back to idle and removes malformed persisted state', () => {
    const key = getUserTourStorageKey('user-a');
    localStorage.setItem(key, JSON.stringify({ status: 'mystery', step: 12 }));

    const tour = useUserTour('user-a');

    expect(tour.state.value).toMatchObject({
      enabled: true,
      status: 'idle',
      step: null
    });
    expect(localStorage.getItem(key)).toBeNull();
  });
});
