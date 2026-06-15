import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from '@/utils/redirect';

describe('getSafeRedirectPath', () => {
  it('returns an internal path that starts with a single slash', () => {
    expect(getSafeRedirectPath('/discover-dna', '/')).toBe('/discover-dna');
  });

  it('falls back when next is missing', () => {
    expect(getSafeRedirectPath(undefined, '/discover-dna')).toBe('/discover-dna');
  });

  it('rejects protocol-relative urls', () => {
    expect(getSafeRedirectPath('//evil.com', '/discover-dna')).toBe('/discover-dna');
  });

  it('rejects http and https urls', () => {
    expect(getSafeRedirectPath('http://evil.com', '/')).toBe('/');
    expect(getSafeRedirectPath('https://evil.com', '/')).toBe('/');
  });

  it('rejects array query values', () => {
    expect(getSafeRedirectPath(['/a', '/b'], '/discover-dna')).toBe('/discover-dna');
  });

  it('rejects paths that do not start with a slash', () => {
    expect(getSafeRedirectPath('discover-dna', '/')).toBe('/');
  });
});
