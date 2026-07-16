import { ref } from 'vue';
import { i18n } from '@/i18n';
import { computeImageEmbedding, loadClipModel } from '@/services/clipEmbedding.service';

export type ClipModelStatus = 'idle' | 'loading' | 'ready' | 'error';

const DOWNLOADED_BEFORE_KEY = 'image-search:clip-model-downloaded';

// 狀態拉到 module 層級（不是每次 useClipModel() 呼叫都新建）：ImageSearch 頁面在同一個
// SPA session 裡卸載又重新掛載時（例如從詳情頁按返回鍵），若狀態放在 composable 內部會
// 回到 idle，逼使用者重新走一次下載確認流程，即使模型其實還在記憶體裡可以直接用。
const status = ref<ClipModelStatus>('idle');
const progress = ref(0);
const error = ref<string | null>(null);

async function load() {
  if (status.value === 'loading' || status.value === 'ready') return;

  status.value = 'loading';
  progress.value = 0;
  error.value = null;

  try {
    await loadClipModel((event) => {
      if (typeof event.progress === 'number') {
        progress.value = Math.round(event.progress);
      }
    });
    status.value = 'ready';
    progress.value = 100;
    localStorage.setItem(DOWNLOADED_BEFORE_KEY, '1');
  } catch {
    status.value = 'error';
    error.value = i18n.global.t('imageSearch.modelDownloadFailed');
  }
}

async function computeEmbedding(file: File): Promise<number[]> {
  return computeImageEmbedding(file);
}

// 模型檔本身瀏覽器已經用 Cache Storage 快取過（transformers.js 預設行為），F5 之後
// 重新 pipeline() 初始化不會再真的重新下載，只是要花點時間重建 session。與其讓使用者
// 每次 F5 都要重新按一次「下載模型」，記過一次「這台裝置下載過」就直接背景自動載入。
function hasDownloadedBefore(): boolean {
  return localStorage.getItem(DOWNLOADED_BEFORE_KEY) === '1';
}

export function useClipModel() {
  return { status, progress, error, load, computeEmbedding, hasDownloadedBefore };
}

// 測試用：重置 module 層級狀態，避免測試之間互相汙染。
export function resetClipModelState(): void {
  status.value = 'idle';
  progress.value = 0;
  error.value = null;
}
