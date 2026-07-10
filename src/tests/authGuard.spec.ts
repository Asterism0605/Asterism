import { describe, expect, it } from 'vitest';
import { resolveAuthGuard } from '@/router/authGuard';

describe('resolveAuthGuard', () => {
  it('requiresAuth 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresAuth: true }, '/moodboard', { isAuthenticated: false, isAdmin: false });
    expect(r).toEqual({ name: 'login', query: { next: '/moodboard' } });
  });

  it('我的預約 requiresAuth 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresAuth: true }, '/account/consultations', {
      isAuthenticated: false,
      isAdmin: false
    });
    expect(r).toEqual({ name: 'login', query: { next: '/account/consultations' } });
  });

  it('requiresAdmin 且非 admin → 導 home', () => {
    const r = resolveAuthGuard({ requiresAdmin: true }, '/review', { isAuthenticated: true, isAdmin: false });
    expect(r).toEqual({ name: 'home' });
  });

  it('requiresAdmin 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresAdmin: true }, '/review', { isAuthenticated: false, isAdmin: false });
    expect(r).toEqual({ name: 'login', query: { next: '/review' } });
  });

  it('條件都滿足 → true', () => {
    expect(resolveAuthGuard({ requiresAdmin: true }, '/review', { isAuthenticated: true, isAdmin: true })).toBe(true);
  });

  it('無 meta 限制 → true', () => {
    expect(resolveAuthGuard({}, '/', { isAuthenticated: false, isAdmin: false })).toBe(true);
  });
});
