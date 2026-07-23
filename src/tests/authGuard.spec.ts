import { describe, expect, it } from 'vitest';
import { resolveAuthGuard } from '@/router/authGuard';

describe('resolveAuthGuard', () => {
  it('requiresAuth 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresAuth: true }, '/moodboard', { isAuthenticated: false, isAdmin: false, isConsultant: false });
    expect(r).toEqual({ name: 'login', query: { next: '/moodboard' } });
  });

  it('我的預約 requiresAuth 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresAuth: true }, '/account/consultations', {
      isAuthenticated: false,
      isAdmin: false,
      isConsultant: false
    });
    expect(r).toEqual({ name: 'login', query: { next: '/account/consultations' } });
  });

  it('requiresAdmin 且非 admin → 導 home', () => {
    const r = resolveAuthGuard({ requiresAdmin: true }, '/review', { isAuthenticated: true, isAdmin: false, isConsultant: false });
    expect(r).toEqual({ name: 'home' });
  });

  it('requiresAdmin 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresAdmin: true }, '/review', { isAuthenticated: false, isAdmin: false, isConsultant: false });
    expect(r).toEqual({ name: 'login', query: { next: '/review' } });
  });

  it('條件都滿足 → true', () => {
    expect(resolveAuthGuard({ requiresAdmin: true }, '/review', { isAuthenticated: true, isAdmin: true, isConsultant: false })).toBe(true);
  });

  it('無 meta 限制 → true', () => {
    expect(resolveAuthGuard({}, '/', { isAuthenticated: false, isAdmin: false, isConsultant: false })).toBe(true);
  });

  it('requiresConsultant 且未登入 → 導 login 帶 next', () => {
    const r = resolveAuthGuard({ requiresConsultant: true }, '/consultant/bookings', {
      isAuthenticated: false,
      isAdmin: false,
      isConsultant: false
    });
    expect(r).toEqual({ name: 'login', query: { next: '/consultant/bookings' } });
  });

  it('requiresConsultant 且已登入但非顧問(含 admin)→ 導 home', () => {
    const r = resolveAuthGuard({ requiresConsultant: true }, '/consultant/bookings', {
      isAuthenticated: true,
      isAdmin: true,
      isConsultant: false
    });
    expect(r).toEqual({ name: 'home' });
  });

  it('requiresConsultant 且是顧問 → true', () => {
    expect(
      resolveAuthGuard({ requiresConsultant: true }, '/consultant/bookings', {
        isAuthenticated: true,
        isAdmin: false,
        isConsultant: true
      })
    ).toBe(true);
  });

  it('requiresAdmin 不因顧問身分放行(權限分離)', () => {
    const r = resolveAuthGuard({ requiresAdmin: true }, '/review', {
      isAuthenticated: true,
      isAdmin: false,
      isConsultant: true
    });
    expect(r).toEqual({ name: 'home' });
  });
});
