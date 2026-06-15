// 把外部傳入的 redirect 目標限制在站內 path，避免 open redirect。
// 只接受以單一 `/` 開頭的字串；`//evil.com`、`http(s)://`、陣列、缺值一律回 fallback。
export function getSafeRedirectPath(next: unknown, fallback: string): string {
  if (typeof next !== 'string') {
    return fallback;
  }

  if (!next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }

  return next;
}
