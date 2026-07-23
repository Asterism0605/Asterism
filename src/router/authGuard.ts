import type { RouteLocationRaw } from 'vue-router';

export interface AuthRouteMeta {
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresConsultant?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isConsultant: boolean;
}

// 純函式：依路由 meta 與登入狀態算出該不該擋。回 true=放行，回 RouteLocationRaw=改導。
// admin 與 consultant 權限完全分離：顧問進不了 /review，admin 進不了顧問頁。
export function resolveAuthGuard(
  meta: AuthRouteMeta,
  fullPath: string,
  state: AuthState
): true | RouteLocationRaw {
  if (
    (meta.requiresAuth || meta.requiresAdmin || meta.requiresConsultant) &&
    !state.isAuthenticated
  ) {
    return { name: 'login', query: { next: fullPath } };
  }
  if (meta.requiresAdmin && !state.isAdmin) {
    return { name: 'home' };
  }
  if (meta.requiresConsultant && !state.isConsultant) {
    return { name: 'home' };
  }
  return true;
}
