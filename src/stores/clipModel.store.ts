import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n } from '@/i18n';
import { computeImageEmbedding, loadClipModel } from '@/services/clipEmbedding.service';

export type ClipModelStatus = 'idle' | 'loading' | 'ready' | 'error';

const DOWNLOADED_BEFORE_KEY = 'image-search:clip-model-downloaded';

// Pinia store（不是每次呼叫 useClipModelStore() 都新建）：ImageSearch 頁面在同一個
// SPA session 裡卸載又重新掛載時（例如從詳情頁按返回鍵），若狀態放在元件內部會回到
// idle，逼使用者重新走一次下載確認流程，即使模型其實還在記憶體裡可以直接用。
export const useClipModelStore = defineStore('clip-model', () => {
  const status = ref<ClipModelStatus>('idle');
  const progress = ref(0);
  const error = ref<string | null>(null);

  async function load() {
    if (status.value === 'loading' || status.value === 'ready') return;

    status.value = 'loading';
    progress.value = 0;
    error.value = null;

    // 模型下載會分好幾個檔案（config/tokenizer/onnx 權重）各自回報 0~100 的進度，
    // 用單一檔案的 progress 直接覆蓋整體進度會讓進度條看起來往回跳（小檔案先跑到
    // 100%，換下一個大檔案又從低數字開始）。這裡改成用各檔案的 loaded/total 位元組
    // 數跨檔案加總，算出來的才是真正的整體百分比。
    const fileProgress = new Map<string, { loaded: number; total: number }>();

    function aggregateProgress(): number {
      let loadedSum = 0;
      let totalSum = 0;
      for (const entry of fileProgress.values()) {
        loadedSum += entry.loaded;
        totalSum += entry.total;
      }
      return totalSum > 0 ? Math.round((loadedSum / totalSum) * 100) : 0;
    }

    try {
      await loadClipModel((event) => {
        if (event.file && typeof event.loaded === 'number' && typeof event.total === 'number') {
          fileProgress.set(event.file, { loaded: event.loaded, total: event.total });
          progress.value = aggregateProgress();
        } else if (typeof event.progress === 'number') {
          progress.value = Math.round(event.progress);
        }
      });
      status.value = 'ready';
      progress.value = 100;
      localStorage.setItem(DOWNLOADED_BEFORE_KEY, '1');
    } catch (e) {
      console.warn('[clipModel] load failed:', e);
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

  return { status, progress, error, load, computeEmbedding, hasDownloadedBefore };
});
