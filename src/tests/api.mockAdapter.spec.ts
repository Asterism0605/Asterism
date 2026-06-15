import { describe, expect, it } from 'vitest';
import { createMockError, createMockSuccess, withMockDelay } from '@/api/mockAdapter';

describe('mockAdapter', () => {
  it('wraps mock data in the shared ApiResponse contract', () => {
    const response = createMockSuccess({ ok: true }, { requestId: 'req_mock' });

    expect(response.data).toEqual({ ok: true });
    expect(response.meta.requestId).toBe('req_mock');
    expect(response.meta.timestamp).toEqual(expect.any(String));
  });

  it('creates typed mock errors without throwing immediately', () => {
    expect(
      createMockError({
        code: 'MOCK_ERROR',
        message: 'Mock request failed',
        status: 400,
        details: { reason: 'test' }
      })
    ).toEqual({
      code: 'MOCK_ERROR',
      message: 'Mock request failed',
      status: 400,
      details: { reason: 'test' }
    });
  });

  it('can delay mock responses for async service flows', async () => {
    await expect(withMockDelay('done', 0)).resolves.toBe('done');
  });
});
