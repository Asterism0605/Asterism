import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import {
  resetUploadedImagePreviewState,
  useUploadedImagePreview
} from '@/composables/useUploadedImagePreview';

function makeFile(name = 'a.jpg'): File {
  return new File([new Uint8Array(4)], name, { type: 'image/jpeg' });
}

describe('useUploadedImagePreview', () => {
  beforeEach(() => {
    resetUploadedImagePreviewState();
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('setFile 後 selectedFile/previewUrl 都會填入', async () => {
    const preview = useUploadedImagePreview();
    const file = makeFile();

    preview.setFile(file);
    await nextTick();

    expect(preview.selectedFile.value).toBe(file);
    expect(preview.previewUrl.value).toBe('blob:mock-url');
  });

  it('換檔案時會 revoke 舊的 preview URL', async () => {
    const preview = useUploadedImagePreview();
    preview.setFile(makeFile('a.jpg'));
    await nextTick();

    preview.setFile(makeFile('b.jpg'));
    await nextTick();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('重新呼叫 useUploadedImagePreview() 仍拿到同一份狀態（跨頁面卸載/重新掛載存活）', async () => {
    const first = useUploadedImagePreview();
    first.setFile(makeFile());
    await nextTick();

    const second = useUploadedImagePreview();

    expect(second.selectedFile.value).toBe(first.selectedFile.value);
    expect(second.previewUrl.value).toBe('blob:mock-url');
  });
});
