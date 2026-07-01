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

// 取出 ApiError 的 code（純物件，非 Error 實例），用來分流特定狀態（如信箱驗證）。
export function getErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }

  return null;
}
