import { readonly, ref } from 'vue';

const isOpen = ref(false);
let confirmAction: (() => void) | null = null;

export const isUserTourPauseOpen = readonly(isOpen);

export function requestUserTourPause(onConfirm: () => void): void {
  confirmAction = onConfirm;
  isOpen.value = true;
}

export function cancelUserTourPause(): void {
  confirmAction = null;
  isOpen.value = false;
}

export function confirmUserTourPause(): void {
  const action = confirmAction;
  cancelUserTourPause();
  action?.();
}
