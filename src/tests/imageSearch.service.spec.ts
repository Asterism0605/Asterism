import { describe, expect, it } from 'vitest';
import { isRejected, isWeakMatch, validateImageFile } from '@/services/imageSearch.service';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], 'photo.jpg', { type });
}

describe('validateImageFile', () => {
  it('接受 jpg/png/webp', () => {
    expect(validateImageFile(makeFile('image/jpeg', 1024))).toBeNull();
    expect(validateImageFile(makeFile('image/png', 1024))).toBeNull();
    expect(validateImageFile(makeFile('image/webp', 1024))).toBeNull();
  });

  it('拒絕非圖片格式', () => {
    expect(validateImageFile(makeFile('application/pdf', 1024))).toBe(
      'Please upload a JPG, PNG, or WebP image.'
    );
  });

  it('拒絕超過 10MB 的檔案', () => {
    expect(validateImageFile(makeFile('image/jpeg', 11 * 1024 * 1024))).toBe(
      'Image must be under 10MB.'
    );
  });

  it('拒絕 0 byte 的檔案', () => {
    expect(validateImageFile(makeFile('image/jpeg', 0))).toBe(
      'Please upload a JPG, PNG, or WebP image.'
    );
  });
});

describe('isRejected', () => {
  it('top-1 低於 reject 門檻 → 拒絕', () => {
    expect(isRejected(IMAGE_SEARCH_CONFIG.retrievalRejectThreshold - 0.01)).toBe(true);
  });

  it('top-1 達到 reject 門檻 → 不拒絕', () => {
    expect(isRejected(IMAGE_SEARCH_CONFIG.retrievalRejectThreshold)).toBe(false);
  });
});

describe('isWeakMatch', () => {
  it('top-1 低於 weak 門檻 → 弱相似（顯示提示）', () => {
    expect(isWeakMatch(IMAGE_SEARCH_CONFIG.weakMatchThreshold - 0.01)).toBe(true);
  });

  it('top-1 達到 weak 門檻 → 非弱相似', () => {
    expect(isWeakMatch(IMAGE_SEARCH_CONFIG.weakMatchThreshold)).toBe(false);
  });
});
