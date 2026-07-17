import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useUploadedImagePreviewStore } from '@/stores/uploadedImagePreview.store';

function makeFile(name = 'a.jpg'): File {
  return new File([new Uint8Array(4)], name, { type: 'image/jpeg' });
}

describe('useUploadedImagePreviewStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('setFile 後 selectedFile/previewUrl 都會填入', async () => {
    const preview = useUploadedImagePreviewStore();
    const file = makeFile();

    preview.setFile(file);
    await nextTick();

    expect(preview.selectedFile).toBe(file);
    expect(preview.previewUrl).toBe('blob:mock-url');
  });

  it('換檔案時會 revoke 舊的 preview URL', async () => {
    const preview = useUploadedImagePreviewStore();
    preview.setFile(makeFile('a.jpg'));
    await nextTick();

    preview.setFile(makeFile('b.jpg'));
    await nextTick();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('重新呼叫 useUploadedImagePreviewStore() 仍拿到同一份狀態（跨頁面卸載/重新掛載存活）', async () => {
    const first = useUploadedImagePreviewStore();
    first.setFile(makeFile());
    await nextTick();

    const second = useUploadedImagePreviewStore();

    expect(second.selectedFile).toBe(first.selectedFile);
    expect(second.previewUrl).toBe('blob:mock-url');
  });
});
