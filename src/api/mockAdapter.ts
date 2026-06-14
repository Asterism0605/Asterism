import type { ApiError, ApiMeta, ApiResponse, MockErrorInput } from '@/types/api';

// MVP 階段使用的 mock helpers。
// 這些 helper 回傳的資料格式，會與未來 auth.api.ts、image.api.ts 等正式 API 檔案保持一致。
function createMockMeta(meta: Partial<ApiMeta> = {}): ApiMeta {
  return {
    timestamp: meta.timestamp ?? new Date().toISOString(),
    requestId: meta.requestId
  };
}

export function createMockSuccess<T>(
  data: T,
  meta: Partial<ApiMeta> = {}
): ApiResponse<T> {
  return {
    data,
    meta: createMockMeta(meta)
  };
}

export function createMockError(input: MockErrorInput): ApiError {
  return {
    code: input.code,
    message: input.message,
    status: input.status,
    details: input.details
  };
}

export function withMockDelay<T>(value: T, delayMs = 300): Promise<T> {
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(value), delayMs);
  });
}
