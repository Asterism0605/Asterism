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
    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).toContain('Your moodboard is still empty.');
    expect(wrapper.find('[data-testid="moodboard-empty-cta"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="moodboard-empty-sphere"]').exists()).toBe(true);
    expect(wrapper.find('img[src="/images/folder-idle.png"]').exists()).toBe(false);
  });

  it('routes the empty state CTA back to the homepage', async () => {
    const { wrapper, router } = await mountMoodboard();

    await wrapper.get('[data-testid="moodboard-empty-cta"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('keeps the orbit view when saved images exist', async () => {
    const store = useMoodboardStore();
    store.createFolder('test');
    store.addImage(store.folders[0].id, { id: 'saved-1', src: '/style-image/saved-1.webp' });

    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).not.toContain('Your moodboard is still empty.');
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('keeps the orbit view when a folder exists with no saved images', async () => {
    const store = useMoodboardStore();
    store.createFolder('test');

    const { wrapper } = await mountMoodboard();

    expect(wrapper.text()).not.toContain('Your moodboard is still empty.');
    expect(wrapper.find('canvas').exists()).toBe(true);
  });
});
