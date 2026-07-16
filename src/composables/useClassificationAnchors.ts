import { ref } from 'vue';
import { i18n } from '@/i18n';
import { fetchClassificationAnchors, type ClassificationAnchor } from '@/api/classificationAnchors.api';

export type ClassificationAnchorsStatus = 'idle' | 'loading' | 'ready' | 'error';

// 狀態拉到 module 層級，理由同 useClipModel：頁面在同一個 SPA session 裡重新掛載時
// 不該讓已經查過的錨點資料被丟掉、逼使用者再等一次查詢。
const status = ref<ClassificationAnchorsStatus>('idle');
const anchors = ref<ClassificationAnchor[]>([]);
const error = ref<string | null>(null);

async function load(dimension: string) {
  if (status.value === 'loading' || status.value === 'ready') return;

  status.value = 'loading';
  error.value = null;

  try {
    anchors.value = await fetchClassificationAnchors(dimension);
    status.value = 'ready';
  } catch {
    status.value = 'error';
    error.value = i18n.global.t('imageSearch.anchorsLoadFailed');
  }
}

export function useClassificationAnchors(dimension: string) {
  return { status, anchors, error, load: () => load(dimension) };
}

// 測試用：重置 module 層級狀態，避免測試之間互相汙染。
export function resetClassificationAnchorsState(): void {
  status.value = 'idle';
  anchors.value = [];
  error.value = null;
}
