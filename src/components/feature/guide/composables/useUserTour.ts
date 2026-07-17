import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

export type UserTourStatus = 'idle' | 'active' | 'paused' | 'completed';

export type UserTourStep =
  | 'home-overview'
  | 'home-image'
  | 'spread-center'
  | 'spread-related-group'
  | 'spread-related-image'
  | 'detail-thumbnail'
  | 'detail-style-tag'
  | 'detail-save';

export interface UserTourState {
  version: 1;
  enabled: boolean;
  status: UserTourStatus;
  step: UserTourStep | null;
  targetImageId?: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'asterism:tour:core';
const STATUSES: ReadonlySet<UserTourStatus> = new Set(['idle', 'active', 'paused', 'completed']);
const STEPS: ReadonlySet<UserTourStep> = new Set([
  'home-overview',
  'home-image',
  'spread-center',
  'spread-related-group',
  'spread-related-image',
  'detail-thumbnail',
  'detail-style-tag',
  'detail-save'
]);

export function getUserTourStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function createIdleState(): UserTourState {
  return {
    version: 1,
    enabled: true,
    status: 'idle',
    step: null,
    updatedAt: new Date().toISOString()
  };
}

function isUserTourState(value: unknown): value is UserTourState {
  if (!value || typeof value !== 'object') return false;

  const state = value as Record<string, unknown>;
  const step = state.step;

  return (
    state.version === 1 &&
    typeof state.enabled === 'boolean' &&
    typeof state.status === 'string' &&
    STATUSES.has(state.status as UserTourStatus) &&
    (step === null || (typeof step === 'string' && STEPS.has(step as UserTourStep))) &&
    (state.targetImageId === undefined || typeof state.targetImageId === 'string') &&
    typeof state.updatedAt === 'string'
  );
}

function readState(userId: string): UserTourState {
  if (typeof window === 'undefined') return createIdleState();

  const key = getUserTourStorageKey(userId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return createIdleState();

    const parsed: unknown = JSON.parse(raw);
    if (isUserTourState(parsed)) return parsed;

    window.localStorage.removeItem(key);
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // The in-memory state remains usable when storage is unavailable.
    }
  }

  return createIdleState();
}

export function useUserTour(userId: MaybeRefOrGetter<string | null | undefined>) {
  const state = ref<UserTourState>(
    toValue(userId) ? readState(toValue(userId) as string) : createIdleState()
  );

  function persist(next: UserTourState): void {
    state.value = next;

    const currentUserId = toValue(userId);
    if (typeof window === 'undefined' || !currentUserId) return;

    try {
      window.localStorage.setItem(getUserTourStorageKey(currentUserId), JSON.stringify(next));
    } catch {
      // The current session can continue without persistence.
    }
  }

  function update(patch: Partial<UserTourState>): void {
    persist({
      ...state.value,
      ...patch,
      version: 1,
      updatedAt: new Date().toISOString()
    });
  }

  function start(targetImageId?: string): void {
    update({
      enabled: true,
      status: 'active',
      step: 'home-overview',
      targetImageId
    });
  }

  function pause(): void {
    if (state.value.status === 'active') update({ status: 'paused' });
  }

  function resume(): void {
    if (state.value.status === 'paused' && state.value.step) {
      update({ enabled: true, status: 'active' });
    }
  }

  function restart(targetImageId?: string): void {
    start(targetImageId);
  }

  function advance(step: UserTourStep, targetImageId = state.value.targetImageId): void {
    update({ status: 'active', step, targetImageId });
  }

  function complete(): void {
    update({ status: 'completed', step: null, targetImageId: undefined });
  }

  function setEnabled(enabled: boolean): void {
    update({
      enabled,
      status: !enabled && state.value.status === 'active' ? 'paused' : state.value.status
    });
  }

  function optOut(): void {
    update({ enabled: false, status: 'idle', step: null, targetImageId: undefined });
  }

  watch(
    () => toValue(userId),
    (nextUserId) => {
      state.value = nextUserId ? readState(nextUserId) : createIdleState();
    }
  );

  return {
    state,
    start,
    pause,
    resume,
    restart,
    advance,
    complete,
    setEnabled,
    optOut
  };
}
