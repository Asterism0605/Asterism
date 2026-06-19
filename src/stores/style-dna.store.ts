import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StyleDnaAnswer } from '@/types/style-dna';
import { computeStyleDnaResult } from '@/utils/computeStyleDnaResult';

const STORAGE_KEY = 'asterism:style-dna-result:v1';

interface PersistedStyleDnaResult {
  answers: StyleDnaAnswer[];
  completedAt: string;
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

  const result = computed(() => computeStyleDnaResult(answers.value));
  const hasCompletedQuiz = computed(() => completedAt.value !== null);
  const preferredStyles = computed(() => result.value.styles.map((style) => style.label));

  function persist(): void {
    const payload: PersistedStyleDnaResult = {
      answers: answers.value,
      completedAt: completedAt.value as string
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function completeQuiz(nextAnswers: StyleDnaAnswer[]): void {
    answers.value = nextAnswers;
    completedAt.value = new Date().toISOString();
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
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function clearResult(): void {
    answers.value = [];
    completedAt.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    answers,
    completedAt,
    result,
    hasCompletedQuiz,
    preferredStyles,
    completeQuiz,
    hydrateResult,
    clearResult
  };
});
