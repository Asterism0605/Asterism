import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import { useMoodboardStore } from '@/stores/moodboard.store';

const { disposeSphere, initSphere, updateSphereImages } = vi.hoisted(() => ({
  disposeSphere: vi.fn(),
  initSphere: vi.fn(),
  updateSphereImages: vi.fn()
}));

vi.mock('@/components/feature/moodboard/sphere', () => ({
  initSphere
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
    disposeSphere.mockReset();
    initSphere.mockReset();
    updateSphereImages.mockReset();
    initSphere.mockReturnValue({
      resize: vi.fn(),
      updateImages: updateSphereImages,
      dispose: disposeSphere
    });
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true, writable: true });
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

  it('shows the newest populated folder until another populated folder is hovered', async () => {
    const savedImage = (id: string) => ({
      itemId: `item-${id}`,
      id,
      src: `/style-image/${id}.webp`,
      title: id,
      styleGroup: 'minimal',
      style: [],
      createdAt: '2026-07-05T00:00:00.000Z'
    });
    const store = useMoodboardStore();
    store.$patch({
      status: 'success',
      folders: [
        {
          id: 'newest-folder',
          name: 'Newest',
          createdAt: '2026-07-06T00:00:00.000Z',
          images: [savedImage('newest-image')]
        },
        {
          id: 'empty-folder',
          name: 'Empty',
          createdAt: '2026-07-04T00:00:00.000Z',
          images: []
        },
        {
          id: 'oldest-folder',
          name: 'Oldest',
          createdAt: '2026-07-03T00:00:00.000Z',
          images: [savedImage('oldest-image')]
        }
      ]
    });

    const { wrapper } = await mountMoodboard();
    await flushPromises();

    expect(initSphere.mock.calls.at(-1)?.[3][0].id).toBe('newest-image');

    await wrapper.get('[data-testid="moodboard-folder-2"]').trigger('mouseenter');
    await flushPromises();
    expect(initSphere).toHaveBeenCalledOnce();
    expect(updateSphereImages.mock.calls.at(-1)?.[0][0].id).toBe('oldest-image');

    const updateCount = updateSphereImages.mock.calls.length;
    await wrapper.get('[data-testid="moodboard-folder-2"]').trigger('mouseleave');
    await wrapper.get('[data-testid="moodboard-folder-1"]').trigger('mouseenter');
    await flushPromises();

    expect(updateSphereImages).toHaveBeenCalledTimes(updateCount);
  });

  it('disposes the active sphere when moodboard data is cleared', async () => {
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
    await mountMoodboard();
    await flushPromises();
    expect(initSphere).toHaveBeenCalled();

    store.clear();
    await flushPromises();

    expect(disposeSphere).toHaveBeenCalled();
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

  describe('fixed 10-slot orbit with dimmed states', () => {
    const savedImage = (id: string) => ({
      itemId: `item-${id}`,
      id,
      src: `/style-image/${id}.webp`,
      title: id,
      styleGroup: 'minimal',
      style: [],
      createdAt: '2026-07-05T00:00:00.000Z'
    });

    function patchFolders() {
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        folders: [
          {
            id: 'folder-1',
            name: 'Studio',
            createdAt: '2026-07-06T00:00:00.000Z',
            images: [savedImage('saved-1')]
          },
          {
            id: 'folder-2',
            name: 'Empty Folder',
            createdAt: '2026-07-05T00:00:00.000Z',
            images: []
          }
        ]
      });
      return store;
    }

    it('always renders exactly 10 folder positions regardless of folder count', async () => {
      patchFolders();
      const { wrapper } = await mountMoodboard();

      expect(wrapper.findAll('[data-testid^="moodboard-folder-"]')).toHaveLength(10);
    });

    it('dims an empty slot that has no folder and blocks hover/click on it', async () => {
      patchFolders();
      const { wrapper, router } = await mountMoodboard();

      const emptySlot = wrapper.get('[data-testid="moodboard-folder-5"]');
      expect(emptySlot.get('img').attributes('style')).toContain('grayscale(1)');

      await emptySlot.trigger('mouseenter');
      expect(emptySlot.get('img').attributes('src')).toBe('/images/folder-idle.png');

      await emptySlot.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/moodboard');
    });

    it('dims a folder that has no saved images but still opens it on click', async () => {
      patchFolders();
      const { wrapper, router } = await mountMoodboard();

      const emptyFolder = wrapper.get('[data-testid="moodboard-folder-1"]');
      expect(emptyFolder.get('img').attributes('style')).toContain('grayscale(1)');

      await emptyFolder.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/moodboard/empty-folder');
    });

    it('does not dim a folder that has saved images', async () => {
      patchFolders();
      const { wrapper } = await mountMoodboard();

      const populatedFolder = wrapper.get('[data-testid="moodboard-folder-0"]');
      expect(populatedFolder.get('img').attributes('style')).not.toContain('grayscale(1)');
    });
  });

  describe('mobile home orbit placeholder photos', () => {
    it('applies the photo-placeholder class only to placeholder photos, not real ones', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true });
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        folders: [
          {
            id: 'folder-1',
            name: 'Studio',
            createdAt: '2026-07-06T00:00:00.000Z',
            images: [
              {
                itemId: 'item-1',
                id: 'saved-1',
                src: '/style-image/saved-1.webp',
                title: 'Saved',
                styleGroup: 'minimal',
                style: [],
                createdAt: '2026-07-06T00:00:00.000Z'
              }
            ]
          }
        ]
      });

      const { wrapper } = await mountMoodboard();

      const cards = wrapper.findAll('.photo-enter .image-card');
      expect(cards.length).toBeGreaterThan(0);

      const placeholderCards = cards.filter((card) => card.classes().includes('photo-placeholder'));
      const realCards = cards.filter((card) => !card.classes().includes('photo-placeholder'));

      expect(placeholderCards.length).toBeGreaterThan(0);
      expect(realCards.length).toBeGreaterThan(0);
      expect(realCards.some((card) => card.find('img').attributes('src') === '/style-image/saved-1.webp')).toBe(
        true
      );
    });
  });
});
