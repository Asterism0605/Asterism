// auth mock 失敗時 throw 的是 ApiError 純物件（非 Error 實例），
// 用守衛取出可顯示的 message，取不到就回 fallback。避免使用 any。
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallback;
}
