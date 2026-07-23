import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const hydrateResult = vi.fn();
  const reconcileWithServer = vi.fn().mockResolvedValue(undefined);
  const useStyleDnaStore = vi.fn((_pinia?: unknown) => ({ hydrateResult, reconcileWithServer }));
  const fetchMoodboard = vi.fn().mockResolvedValue(undefined);
  const clearMoodboard = vi.fn();
  const useMoodboardStore = vi.fn((_pinia?: unknown) => ({
    fetchMoodboard,
    clear: clearMoodboard
  }));
  const app = {
    use: vi.fn(),
    mount: vi.fn()
  };
  app.use.mockReturnValue(app);

  return {
    app,
    createApp: vi.fn(() => app),
    hydrateResult,
    fetchMoodboard,
    clearMoodboard,
    reconcileWithServer,
    router: { install: vi.fn() },
    useStyleDnaStore,
    useMoodboardStore
  };
});

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();

  return {
    ...actual,
    createApp: mocks.createApp
  };
});

vi.mock('@/App.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/router', () => ({ default: mocks.router }));
vi.mock('@/stores/style-dna.store', () => ({ useStyleDnaStore: mocks.useStyleDnaStore }));
vi.mock('@/stores/moodboard.store', () => ({ useMoodboardStore: mocks.useMoodboardStore }));
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    hydrate: vi.fn().mockResolvedValue(undefined),
    user: { id: 'user-1' }
  })
}));
vi.mock('@/services/image.service', () => ({ loadImages: vi.fn().mockResolvedValue(undefined) }));

describe('main', () => {
  it('hydrates the Style DNA result before mounting the app', async () => {
    await import('@/main');
    await new Promise(r => setTimeout(r, 0));

    const pinia = mocks.useStyleDnaStore.mock.calls[0]?.[0];

    expect(mocks.useStyleDnaStore).toHaveBeenCalledTimes(1);
    expect(mocks.hydrateResult).toHaveBeenCalledTimes(1);
    expect(mocks.reconcileWithServer).toHaveBeenCalledWith('user-1');
    expect(mocks.fetchMoodboard).toHaveBeenCalledWith('user-1');
    expect(mocks.app.use).toHaveBeenNthCalledWith(1, pinia);
    expect(mocks.app.use).toHaveBeenNthCalledWith(2, mocks.router);
    expect(mocks.app.mount).toHaveBeenCalledWith('#app');
  });
});
