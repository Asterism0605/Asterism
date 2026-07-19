import { getCurrentInstance, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

export type UserTourStatus = 'idle' | 'active' | 'paused' | 'transition' | 'completed';

export type UserTourChapter = 'exploration' | 'moodboard';

export type UserTourStep =
  | 'home-overview'
  | 'home-image'
  | 'spread-related-group'
  | 'spread-related-image'
  | 'detail-thumbnail'
  | 'detail-style-tag'
  | 'detail-consult'
  | 'detail-save';

export interface UserTourState {
  version: 1;
  enabled: boolean;
  status: UserTourStatus;
  currentChapter: UserTourChapter | null;
  completedChapters: UserTourChapter[];
  step: UserTourStep | null;
  targetImageId?: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'asterism:tour:core';
const USER_TOUR_STATE_EVENT = 'asterism:user-tour-state-change';
interface UserTourStateChange {
  userId: string;
  state: UserTourState;
}
const STATUSES: ReadonlySet<UserTourStatus> = new Set([
  'idle',
  'active',
  'paused',
  'transition',
  'completed'
]);
const CHAPTERS: ReadonlySet<UserTourChapter> = new Set(['exploration', 'moodboard']);
const STEPS: ReadonlySet<UserTourStep> = new Set([
  'home-overview',
  'home-image',
  'spread-related-group',
  'spread-related-image',
  'detail-thumbnail',
  'detail-style-tag',
  'detail-consult',
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
    currentChapter: null,
    completedChapters: [],
    step: null,
    updatedAt: new Date().toISOString()
  };
}

function isUserTourState(value: unknown): value is UserTourState {
  if (!value || typeof value !== 'object') return false;

  const state = value as Record<string, unknown>;
  const step = state.step;
  const currentChapter = state.currentChapter;
  const completedChapters = state.completedChapters;

  return (
    state.version === 1 &&
    typeof state.enabled === 'boolean' &&
    typeof state.status === 'string' &&
    STATUSES.has(state.status as UserTourStatus) &&
    (currentChapter === undefined ||
      currentChapter === null ||
      (typeof currentChapter === 'string' && CHAPTERS.has(currentChapter as UserTourChapter))) &&
    (completedChapters === undefined ||
      (Array.isArray(completedChapters) &&
        completedChapters.every(
          (chapter): chapter is UserTourChapter =>
            typeof chapter === 'string' && CHAPTERS.has(chapter as UserTourChapter)
        ))) &&
    (step === null || (typeof step === 'string' && STEPS.has(step as UserTourStep))) &&
    (state.targetImageId === undefined || typeof state.targetImageId === 'string') &&
    typeof state.updatedAt === 'string'
  );
}

function normalizeState(value: UserTourState): UserTourState {
  return {
    ...value,
    currentChapter:
      value.currentChapter ?? (value.step === null ? null : 'exploration'),
    completedChapters: value.completedChapters ?? []
  };
}

function readState(userId: string): UserTourState {
  if (typeof window === 'undefined') return createIdleState();

  const key = getUserTourStorageKey(userId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return createIdleState();

    const parsed: unknown = JSON.parse(raw);
    if (isUserTourState(parsed)) return normalizeState(parsed);

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

  const currentInstance = getCurrentInstance();
  const handleExternalStateChange = (event: Event) => {
    const currentUserId = toValue(userId);
    const detail = (event as CustomEvent<Partial<UserTourStateChange>>).detail;

    if (
      currentUserId &&
      detail?.userId === currentUserId &&
      detail.state &&
      isUserTourState(detail.state)
    ) {
      state.value = normalizeState(detail.state);
    }
  };

  if (currentInstance && typeof window !== 'undefined') {
    window.addEventListener(USER_TOUR_STATE_EVENT, handleExternalStateChange);
    onBeforeUnmount(() => {
      window.removeEventListener(USER_TOUR_STATE_EVENT, handleExternalStateChange);
    });
  }

  function persist(next: UserTourState): void {
    state.value = next;

    const currentUserId = toValue(userId);
    if (typeof window === 'undefined' || !currentUserId) return;

    try {
      window.localStorage.setItem(getUserTourStorageKey(currentUserId), JSON.stringify(next));
    } catch {
      // The current session can continue without persistence.
    }

    if (currentInstance) {
      window.dispatchEvent(
        new CustomEvent<UserTourStateChange>(USER_TOUR_STATE_EVENT, {
          detail: { userId: currentUserId, state: next }
        })
      );
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
      currentChapter: 'exploration',
      completedChapters: [],
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
    update({
      status: 'active',
      currentChapter: state.value.currentChapter ?? 'exploration',
      step,
      targetImageId
    });
  }

  // Chapter 1 currently uses this as the handoff into the Moodboard transition.
  function completeChapter(chapter: UserTourChapter): void {
    const completedChapters = state.value.completedChapters.includes(chapter)
      ? state.value.completedChapters
      : [...state.value.completedChapters, chapter];

    update({
      status: 'transition',
      currentChapter: chapter,
      completedChapters,
      step: null,
      targetImageId: undefined
    });
  }

  function enterChapter(chapter: UserTourChapter): void {
    update({
      status: 'paused',
      currentChapter: chapter,
      step: null,
      targetImageId: undefined
    });
  }

  function complete(): void {
    update({
      status: 'completed',
      currentChapter: null,
      step: null,
      targetImageId: undefined
    });
  }

  function setEnabled(enabled: boolean): void {
    update({
      enabled,
      status: !enabled && state.value.status === 'active' ? 'paused' : state.value.status
    });
  }

  function optOut(): void {
    update({
      enabled: false,
      status: 'idle',
      currentChapter: null,
      completedChapters: [],
      step: null,
      targetImageId: undefined
    });
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
    completeChapter,
    enterChapter,
    complete,
    setEnabled,
    optOut
  };
}
