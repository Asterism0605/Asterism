import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import { useMoodboardStore } from '@/stores/moodboard.store';

vi.mock('@/components/feature/moodboard/sphere', () => ({
  initSphere: vi.fn(() => ({ resize: vi.fn(), dispose: vi.fn() }))
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/moodboard/:slug?', name: 'moodboard', component: MoodboardOrbit }
    ]
  });
}

async function mountMoodboard() {
  const router = createTestRouter();
  await router.push('/moodboard');
  await router.isReady();

  const wrapper = mount(MoodboardOrbit, {
    global: {
      plugins: [router]
    }
  });

  return { wrapper, router };
}

describe('MoodboardOrbit', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('shows the empty state when no images are saved', async () => {
    const store = useMoodboardStore();
    store.$patch({ status: 'success', folders: [] });
    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).toContain('Your moodboard is still empty.');
    expect(wrapper.find('[data-testid="moodboard-empty-cta"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="moodboard-empty-sphere"]').exists()).toBe(true);
    expect(wrapper.find('img[src="/images/folder-idle.png"]').exists()).toBe(false);
  });

  it('routes the empty state CTA back to the homepage', async () => {
    const store = useMoodboardStore();
    store.$patch({ status: 'success', folders: [] });
    const { wrapper, router } = await mountMoodboard();

    await wrapper.get('[data-testid="moodboard-empty-cta"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('keeps the orbit view when saved images exist', async () => {
    const store = useMoodboardStore();
    store.$patch({
      status: 'success',
      folders: [
        {
          id: 'folder-1',
          name: 'Studio',
          createdAt: '2026-07-05T00:00:00.000Z',
          images: [
            {
              itemId: 'item-1',
              id: 'saved-1',
              src: '/style-image/saved-1.webp',
              title: 'Saved',
              styleGroup: 'minimal',
              style: [],
              createdAt: '2026-07-05T00:00:00.000Z'
            }
          ]
        }
      ]
    });

    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).not.toContain('Your moodboard is still empty.');
    expect(wrapper.find('canvas').exists()).toBe(true);
    expect(wrapper.text()).toContain('Studio');
  });

  it('keeps an empty folder in the empty state because it has no saved images', async () => {
    const store = useMoodboardStore();
    store.$patch({
      status: 'success',
      folders: [
        {
          id: 'folder-1',
          name: 'Studio',
          createdAt: '2026-07-05T00:00:00.000Z',
          images: []
        }
      ]
    });

    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).toContain('Your moodboard is still empty.');
  });

  it('shows a loading state without flashing the empty state', async () => {
    const store = useMoodboardStore();
    store.$patch({ status: 'loading', folders: [] });

    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).toContain('Loading your moodboard...');
    expect(wrapper.text()).not.toContain('Your moodboard is still empty.');
  });

  it('shows a Data API error separately from the empty state', async () => {
    const store = useMoodboardStore();
    store.$patch({ status: 'error', error: 'network down', folders: [] });

    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).toContain("We couldn't load your moodboard.");
    expect(wrapper.text()).not.toContain('Your moodboard is still empty.');
  });
});
