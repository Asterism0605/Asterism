import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const hydrateResult = vi.fn();
  const useStyleDnaStore = vi.fn(() => ({ hydrateResult }));
  const app = {
    use: vi.fn(),
    mount: vi.fn()
  };
  app.use.mockReturnValue(app);

  return {
    app,
    createApp: vi.fn(() => app),
    hydrateResult,
    router: { install: vi.fn() },
    useStyleDnaStore
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
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => ({ hydrate: vi.fn() }) }));

describe('main', () => {
  it('hydrates the Style DNA result before mounting the app', async () => {
    await import('@/main');

    const pinia = mocks.useStyleDnaStore.mock.calls[0]?.[0];

    expect(mocks.useStyleDnaStore).toHaveBeenCalledTimes(1);
    expect(mocks.hydrateResult).toHaveBeenCalledTimes(1);
    expect(mocks.app.use).toHaveBeenNthCalledWith(1, pinia);
    expect(mocks.app.use).toHaveBeenNthCalledWith(2, mocks.router);
    expect(mocks.app.mount).toHaveBeenCalledWith('#app');
  });
});
