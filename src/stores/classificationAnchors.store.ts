import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n } from '@/i18n';
import { fetchClassificationAnchors, type ClassificationAnchor } from '@/api/classificationAnchors.api';

export type ClassificationAnchorsStatus = 'idle' | 'loading' | 'ready' | 'error';

// Pinia store，理由同 clipModel.store：頁面在同一個 SPA session 裡重新掛載時
// 不該讓已經查過的錨點資料被丟掉、逼使用者再等一次查詢。
export const useClassificationAnchorsStore = defineStore('classification-anchors', () => {
  const status = ref<ClassificationAnchorsStatus>('idle');
  const anchors = ref<ClassificationAnchor[]>([]);
  const error = ref<string | null>(null);

  async function load(dimension: string) {
    if (status.value === 'loading' || status.value === 'ready') return;

    status.value = 'loading';
    error.value = null;

    try {
      const fetched = await fetchClassificationAnchors(dimension);
      if (fetched.length === 0) {
        throw new Error(`No classification anchors found for dimension "${dimension}".`);
      }
      anchors.value = fetched;
      status.value = 'ready';
    } catch (e) {
      console.warn('[classificationAnchors] load failed:', e);
      status.value = 'error';
      error.value = i18n.global.t('imageSearch.anchorsLoadFailed');
    }
  }

  return { status, anchors, error, load };
});
