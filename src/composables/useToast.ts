import { readonly, ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  type: ToastType;
  message: string;
  actionText?: string;
  duration?: number;
  onAction?: (() => void) | null;
}

export interface ToastState extends Omit<ToastOptions, 'duration' | 'onAction'> {
  id: number;
  duration: number;
  onAction: (() => void) | null;
}

const toast = ref<ToastState | null>(null);

let toastId = 0;
let hideTimer: ReturnType<typeof window.setTimeout> | null = null;

const clearHideTimer = () => {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
};

export function hideToast() {
  clearHideTimer();
  toast.value = null;
}

export function showToast(options: ToastOptions) {
  clearHideTimer();

  toast.value = {
    id: ++toastId,
    duration: 5000,
    onAction: null,
    ...options
  };

  if (toast.value.duration > 0) {
    hideTimer = window.setTimeout(() => {
      toast.value = null;
      hideTimer = null;
    }, toast.value.duration);
  }
}

export function resetToastState() {
  toastId = 0;
  hideToast();
}

export function useToast() {
  return {
    toast: readonly(toast)
  };
}
