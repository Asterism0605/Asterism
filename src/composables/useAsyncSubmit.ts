import { ref } from 'vue';
import { getErrorMessage } from '@/utils/api-error';

// 表單送出共用邏輯：isSubmitting 防重送 + errorMessage 重置 + try/catch/finally。
// action 只放「成功要做的事」，錯誤一律轉成 errorMessage。
export function useAsyncSubmit() {
  const isSubmitting = ref(false);
  const errorMessage = ref('');

  async function submit(action: () => Promise<void>, fallbackMessage: string) {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    errorMessage.value = '';
    try {
      await action();
    } catch (error) {
      errorMessage.value = getErrorMessage(error, fallbackMessage);
    } finally {
      isSubmitting.value = false;
    }
  }

  return { isSubmitting, errorMessage, submit };
}
