import { defineStore } from 'pinia';
import { ref } from 'vue';

// AppHeader 是全域 layout，不知道各頁面自己有沒有開 StyleTagModal；
// 用這個共享狀態讓 AppHeader 在 modal 開著時可以調整版面（例如 PictureDetail
// 頁面平常把 AppHeader 縮到 60% 寬讓「返回」那排並排，modal 開著時改滿版）。
export const useStyleTagModalStore = defineStore('style-tag-modal', () => {
  const isOpen = ref(false);

  function setOpen(value: boolean) {
    isOpen.value = value;
  }

  return { isOpen, setOpen };
});
