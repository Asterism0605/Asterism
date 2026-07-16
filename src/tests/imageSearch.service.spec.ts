import { describe, expect, it } from 'vitest';
import { meetsSimilarityThreshold, validateImageFile } from '@/services/imageSearch.service';

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
});

describe('meetsSimilarityThreshold', () => {
  it('高於門檻回傳 true', () => {
    expect(meetsSimilarityThreshold(0.8)).toBe(true);
  });

  it('低於門檻回傳 false', () => {
    expect(meetsSimilarityThreshold(0.3)).toBe(false);
  });
});
