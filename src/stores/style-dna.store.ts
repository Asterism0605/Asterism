import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StyleDnaAnswer } from '@/types/style-dna';
import {
  computeStyleDnaResult,
  type ComputedStyleDnaResult
} from '@/utils/computeStyleDnaResult';
import { fetchStyleDnaProfile, saveStyleDnaResult } from '@/services/style-dna.service';

const STORAGE_KEY = 'asterism:style-dna-result:v1';

interface PersistedStyleDnaResult {
  answers: StyleDnaAnswer[];
  completedAt: string;
  userId: string | null;
}

const isPersistedStyleDnaResult = (value: unknown): value is PersistedStyleDnaResult => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.answers) && typeof candidate.completedAt === 'string';
};

export const useStyleDnaStore = defineStore('style-dna', () => {
  const answers = ref<StyleDnaAnswer[]>([]);
  const completedAt = ref<string | null>(null);
  const localUserId = ref<string | null>(null);
  const serverResult = ref<ComputedStyleDnaResult | null>(null);

  const hasLocalResult = computed(() => completedAt.value !== null && answers.value.length > 0);
  const result = computed(() =>
    hasLocalResult.value ? computeStyleDnaResult(answers.value) : serverResult.value ?? computeStyleDnaResult()
  );
  const hasCompletedQuiz = computed(() => completedAt.value !== null || serverResult.value !== null);
  const preferredStyles = computed(() => result.value.styles.map((style) => style.label));

  function persist(): void {
    const payload: PersistedStyleDnaResult = {
      answers: answers.value,
      completedAt: completedAt.value as string,
      userId: localUserId.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function completeQuiz(nextAnswers: StyleDnaAnswer[], ownerUserId: string | null = null): void {
    answers.value = nextAnswers;
    completedAt.value = new Date().toISOString();
    localUserId.value = ownerUserId;
    serverResult.value = null;
    persist();
  }

  function hydrateResult(): void {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;

      if (!isPersistedStyleDnaResult(parsed)) {
        throw new Error('Malformed Style DNA result in localStorage');
      }

      answers.value = parsed.answers;
      completedAt.value = parsed.completedAt;
      localUserId.value = typeof parsed.userId === 'string' ? parsed.userId : null;
      serverResult.value = null;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function saveCurrentResultToServer(userId: string): Promise<void> {
    if (!hasCompletedQuiz.value) {
      return;
    }

    await saveStyleDnaResult(userId, result.value);

    if (hasLocalResult.value) {
      localUserId.value = userId;
      persist();
    }
  }

  async function reconcileWithServer(userId: string): Promise<void> {
    try {
      if (hasLocalResult.value && localUserId.value !== userId) {
        clearResult();
      }

      const profile = await fetchStyleDnaProfile(userId);

      if (profile.result) {
        serverResult.value = profile.result;
        return;
      }

      if (hasLocalResult.value) {
        await saveCurrentResultToServer(userId);
      }
    } catch (error) {
      console.warn('[style-dna] sync with Supabase failed:', error);
    }
  }

  function clearResult(): void {
    answers.value = [];
    completedAt.value = null;
    localUserId.value = null;
    serverResult.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    answers,
    completedAt,
    localUserId,
    serverResult,
    result,
    hasCompletedQuiz,
    preferredStyles,
    completeQuiz,
    hydrateResult,
    saveCurrentResultToServer,
    reconcileWithServer,
    clearResult
  };
});
