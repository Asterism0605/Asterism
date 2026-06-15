export interface ApiMeta {
  requestId?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface MockErrorInput {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
}
