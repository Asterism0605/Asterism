import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchClassificationAnchorsMock = vi.fn();
vi.mock('@/api/classificationAnchors.api', () => ({
  fetchClassificationAnchors: (...args: unknown[]) => fetchClassificationAnchorsMock(...args)
}));

import { resetClassificationAnchorsState, useClassificationAnchors } from '@/composables/useClassificationAnchors';

describe('useClassificationAnchors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetClassificationAnchorsState();
  });

  it('load 成功後 status 變 ready、anchors 填入資料', async () => {
    fetchClassificationAnchorsMock.mockResolvedValue([{ label: 'A', embedding: [1, 0] }]);
    const composable = useClassificationAnchors('styleGroup');

    await composable.load();

    expect(fetchClassificationAnchorsMock).toHaveBeenCalledWith('styleGroup');
    expect(composable.status.value).toBe('ready');
    expect(composable.anchors.value).toEqual([{ label: 'A', embedding: [1, 0] }]);
  });

  it('load 失敗 status 變 error 並帶錯誤訊息', async () => {
    fetchClassificationAnchorsMock.mockRejectedValue(new Error('network fail'));
    const composable = useClassificationAnchors('styleGroup');

    await composable.load();

    expect(composable.status.value).toBe('error');
    expect(composable.error.value).toBe('風格資料載入失敗，請稍後再試。');
  });

  it('重複呼叫 load 在 loading/ready 狀態時不重跑', async () => {
    fetchClassificationAnchorsMock.mockResolvedValue([]);
    const composable = useClassificationAnchors('styleGroup');

    await composable.load();
    await composable.load();

    expect(fetchClassificationAnchorsMock).toHaveBeenCalledTimes(1);
  });

  it('load 失敗後可以重試', async () => {
    fetchClassificationAnchorsMock.mockRejectedValueOnce(new Error('network fail'));
    fetchClassificationAnchorsMock.mockResolvedValueOnce([{ label: 'A', embedding: [1, 0] }]);
    const composable = useClassificationAnchors('styleGroup');

    await composable.load();
    expect(composable.status.value).toBe('error');

    await composable.load();
    expect(composable.status.value).toBe('ready');
    expect(fetchClassificationAnchorsMock).toHaveBeenCalledTimes(2);
  });
});
