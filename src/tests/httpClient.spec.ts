import type { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { httpClient, normalizeApiError } from '@/api/httpClient';

describe('httpClient', () => {
  it('creates one configured axios instance for API modules', () => {
    expect(httpClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL ?? '');
    expect(httpClient.defaults.timeout).toBe(10000);
  });

  it('normalizes axios response errors into the shared ApiError shape', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          code: 'AUTH_REQUIRED',
          message: 'Please sign in first',
          details: { field: 'email' }
        }
      }
    } as AxiosError;

    expect(normalizeApiError(error)).toEqual({
      code: 'AUTH_REQUIRED',
      message: 'Please sign in first',
      status: 401,
      details: { field: 'email' }
    });
  });

  it('uses a safe fallback for unknown errors', () => {
    expect(normalizeApiError(new Error('Network down'))).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'Network down'
    });
  });
});
