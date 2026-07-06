import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumePendingMoodboardAction,
  savePendingMoodboardAction
} from '@/services/pendingMoodboardAction.service';

describe('pendingMoodboardAction.service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('stores and consumes a matching save-menu intent once', () => {
    savePendingMoodboardAction('image-1', '/images/image-1');

    expect(localStorage.getItem('asterism:pending-moodboard-action')).not.toBeNull();
    expect(sessionStorage.getItem('asterism:pending-moodboard-action')).toBeNull();
    expect(consumePendingMoodboardAction('image-1')).toBe('ready');
    expect(localStorage.getItem('asterism:pending-moodboard-action')).toBeNull();
    expect(consumePendingMoodboardAction('image-1')).toBeNull();
  });

  it('clears an expired intent instead of resuming it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T00:00:00.000Z'));
    savePendingMoodboardAction('image-1', '/images/image-1');
    vi.advanceTimersByTime(30 * 60 * 1000 + 1);

    expect(consumePendingMoodboardAction('image-1')).toBe('discarded');
    expect(consumePendingMoodboardAction('image-1')).toBeNull();
  });
});
