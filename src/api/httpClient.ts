import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/api';

// Central axios instance for future backend calls.
// API modules should use this file instead of creating their own axios clients.
const API_TIMEOUT_MS = 10000;

interface ApiErrorPayload {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

function normalizeDetails(details: unknown): Record<string, unknown> | undefined {
  return typeof details === 'object' && details !== null && !Array.isArray(details)
    ? (details as Record<string, unknown>)
    : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const payload = axiosError.response?.data;

    if (isApiErrorPayload(payload)) {
      return {
        code: typeof payload.code === 'string' ? payload.code : 'API_ERROR',
        message:
          typeof payload.message === 'string'
            ? payload.message
            : axiosError.message || 'Request failed',
        status: axiosError.response?.status,
        details: normalizeDetails(payload.details)
      };
    }

    return {
      code: axiosError.code ?? 'API_ERROR',
      message: axiosError.message || 'Request failed',
      status: axiosError.response?.status
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'Unexpected error'
  };
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: API_TIMEOUT_MS
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Reserved for future token injection. Keep auth store out of the API client boundary.
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error))
);
