import { describe, expect, it, mock } from 'bun:test';
import { ApiClientError, createApiClient } from '../../src/helpers/api-client';

describe('api-client', () => {
  it('handles successful get requests', async () => {
    const originalFetch = global.fetch;
    const fetchMock = mock(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true, message: 'ok', data: { id: '1' } }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = createApiClient({ baseUrl: 'http://localhost:3101' });
    const response = await client.get<{ id: string }>('/api/internal/users/oldest');
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe('1');

    global.fetch = originalFetch;
  });

  it('throws ApiClientError on non-ok responses', async () => {
    const originalFetch = global.fetch;
    const fetchMock = mock(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({
        message: 'User not found',
        error: { code: 'USER_NOT_FOUND', details: [] },
      }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = createApiClient({ baseUrl: 'http://localhost:3101' });
    let captured: unknown;
    try {
      await client.get('/api/internal/users/oldest');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(ApiClientError);

    global.fetch = originalFetch;
  });
});
