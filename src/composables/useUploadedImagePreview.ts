import { ref, watch } from 'vue';

// 狀態拉到 module 層級，理由同 useClipModel：使用者從搜尋結果點進詳情頁再按返回時，
// ImageSearch 頁面會被卸載又重新掛載，若上傳的檔案/預覽圖放在 composable 內部會被
// 清空，使用者會看到自己剛剛上傳的圖片憑空消失。
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

// ponytail: 這裡不像頁面卸載時那樣呼叫 URL.revokeObjectURL——狀態現在是 module 層級、
// 要跨頁面導覽存活，沒有適合的「真的不再需要了」時機可以掛 revoke。舊的預覽網址只有
// 在使用者選新檔案時才會被下一行的 revoke 換掉，同一時間最多留一個沒用到的 blob URL，
// 全站只有這一個地方會用到，可接受。真的要更嚴謹可以在 F5/關分頁時掛 beforeunload。
watch(selectedFile, (file) => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = file ? URL.createObjectURL(file) : null;
});

export function useUploadedImagePreview() {
  function setFile(file: File | null) {
    selectedFile.value = file;
  }

  return { selectedFile, previewUrl, setFile };
}

// 測試用：重置 module 層級狀態，避免測試之間互相汙染。
export function resetUploadedImagePreviewState(): void {
  selectedFile.value = null;
  previewUrl.value = null;
}
