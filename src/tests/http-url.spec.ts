import { describe, expect, it } from 'vitest';
import { isHttpUrl } from '@/utils/http-url';

describe('isHttpUrl', () => {
  it('接受 http/https', () => {
    expect(isHttpUrl('https://meet.example.com/abc')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
  });

  it('拒絕非 http(s) 與非法輸入', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('ftp://x')).toBe(false);
    expect(isHttpUrl('台北市信義區')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
  });
});
