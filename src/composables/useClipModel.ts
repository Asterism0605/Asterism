import { ref } from 'vue';
import { computeImageEmbedding, loadClipModel } from '@/services/clipEmbedding.service';

export type ClipModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useClipModel() {
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
    } catch {
      status.value = 'error';
      error.value = '模型下載失敗，請檢查網路連線後重試。';
    }
  }

  async function computeEmbedding(file: File): Promise<number[]> {
    return computeImageEmbedding(file);
  }

  return { status, progress, error, load, computeEmbedding };
}
