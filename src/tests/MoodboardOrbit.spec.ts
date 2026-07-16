import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { useAuthStore } from '@/stores/auth.store';

const { disposeSphere, initSphere, updateSphereImages } = vi.hoisted(() => ({
  disposeSphere: vi.fn(),
  initSphere: vi.fn(),
  updateSphereImages: vi.fn()
}));

const { deleteFolderMock, deleteItemMock, getMoodboardViewModelMock } = vi.hoisted(() => ({
  deleteFolderMock: vi.fn(),
  deleteItemMock: vi.fn(),
  getMoodboardViewModelMock: vi.fn()
}));

const { showToastMock } = vi.hoisted(() => ({
  showToastMock: vi.fn()
}));

vi.mock('@/components/feature/moodboard/sphere', () => ({
  initSphere
}));

vi.mock('@/services/moodboard.service', () => ({
  deleteFolder: deleteFolderMock,
  deleteItem: deleteItemMock,
  getMoodboardViewModel: getMoodboardViewModelMock
}));

vi.mock('@/composables/useToast', () => ({
  showToast: showToastMock
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/moodboard/:slug?', name: 'moodboard', component: MoodboardOrbit },
      { path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }
    ]
  });
}

async function mountMoodboard(initialPath = '/moodboard') {
  const router = createTestRouter();
  await router.push(initialPath);
  await router.isReady();

  const wrapper = mount(MoodboardOrbit, {
    attachTo: document.body,
    global: {
      plugins: [router],
      stubs: { Teleport: true }
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
    deleteFolderMock.mockReset();
    deleteItemMock.mockReset();
    getMoodboardViewModelMock.mockReset();
    showToastMock.mockReset();
    initSphere.mockReturnValue({
      resize: vi.fn(),
      updateImages: updateSphereImages,
      dispose: disposeSphere
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
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
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
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
      expect(
        realCards.some((card) => card.find('img').attributes('src') === '/style-image/saved-1.webp')
      ).toBe(true);
    });
  });

  describe('delete folder flow', () => {
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
      useAuthStore().$patch({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          isAdmin: false,
          createdAt: '2026-07-01T00:00:00.000Z'
        }
      });
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        loadedProfileId: 'user-1',
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

    it('desktop only shows the delete icon while hovering the folder, including empty folders', async () => {
      patchFolders();
      const { wrapper } = await mountMoodboard();

      expect(wrapper.get('[data-testid="folder-delete-0"]').attributes('style')).toContain(
        'opacity: 0'
      );

      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('mouseenter');
      expect(wrapper.get('[data-testid="folder-delete-0"]').attributes('style')).toContain(
        'opacity: 1'
      );
      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('mouseleave');

      await wrapper.get('[data-testid="moodboard-folder-1"]').trigger('mouseenter');
      expect(wrapper.get('[data-testid="folder-delete-1"]').attributes('style')).toContain(
        'opacity: 1'
      );
    });

    it('clicking the delete icon only opens the confirm modal, without opening the folder', async () => {
      patchFolders();
      const { wrapper, router } = await mountMoodboard();

      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('mouseenter');
      await wrapper.get('[data-testid="folder-delete-0"]').trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard');
      expect(wrapper.find('[data-testid="delete-folder-confirm"]').exists()).toBe(true);
    });

    it('removes the folder immediately and closes the modal after a successful delete', async () => {
      deleteFolderMock.mockResolvedValue(undefined);
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();

      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('mouseenter');
      await wrapper.get('[data-testid="folder-delete-0"]').trigger('click');
      await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');
      await flushPromises();

      expect(deleteFolderMock).toHaveBeenCalledWith('folder-1', 'user-1');
      expect(store.folders.some((folder) => folder.id === 'folder-1')).toBe(false);
      expect(wrapper.find('[data-testid="delete-folder-confirm"]').exists()).toBe(false);
    });

    it('keeps the modal open and the folder intact on a failed delete, showing an error toast, and allows retry', async () => {
      deleteFolderMock.mockRejectedValueOnce(new Error('boom'));
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();

      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('mouseenter');
      await wrapper.get('[data-testid="folder-delete-0"]').trigger('click');
      await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="delete-folder-confirm"]').exists()).toBe(true);
      expect(store.folders.some((folder) => folder.id === 'folder-1')).toBe(true);
      expect(showToastMock).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to delete the folder. Please try again.'
      });

      deleteFolderMock.mockResolvedValueOnce(undefined);
      await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');
      await flushPromises();

      expect(store.folders.some((folder) => folder.id === 'folder-1')).toBe(false);
      expect(wrapper.find('[data-testid="delete-folder-confirm"]').exists()).toBe(false);
    });

    it('mobile shows the delete icon persistently and can delete without hovering first', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      deleteFolderMock.mockResolvedValue(undefined);
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();

      await wrapper.get('[data-testid="folder-delete-mobile-0"]').trigger('click');
      await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');
      await flushPromises();

      expect(deleteFolderMock).toHaveBeenCalledWith('folder-1', 'user-1');
      expect(store.folders.some((folder) => folder.id === 'folder-1')).toBe(false);
    });

    it('mobile shows an error toast and keeps the folder on a failed delete', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      deleteFolderMock.mockRejectedValueOnce(new Error('boom'));
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();

      await wrapper.get('[data-testid="folder-delete-mobile-0"]').trigger('click');
      await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');
      await flushPromises();

      expect(store.folders.some((folder) => folder.id === 'folder-1')).toBe(true);
      expect(showToastMock).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to delete the folder. Please try again.'
      });
    });
  });

  describe('delete image flow', () => {
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
      useAuthStore().$patch({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          isAdmin: false,
          createdAt: '2026-07-01T00:00:00.000Z'
        }
      });
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        loadedProfileId: 'user-1',
        folders: [
          {
            id: 'folder-1',
            name: 'Studio',
            createdAt: '2026-07-06T00:00:00.000Z',
            images: [savedImage('saved-1'), savedImage('saved-2')]
          }
        ]
      });
      return store;
    }

    async function openFolder(wrapper: Awaited<ReturnType<typeof mountMoodboard>>['wrapper']) {
      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('click');
      await flushPromises();
    }

    it('desktop only shows the image delete icon while hovering that photo', async () => {
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();
      await openFolder(wrapper);
      const itemId = store.folders[0].images[0].itemId;

      expect(wrapper.get(`[data-testid="image-delete-${itemId}"]`).attributes('style')).toContain(
        'opacity: 0'
      );

      await wrapper.get(`[data-testid="moodboard-image-${itemId}"]`).trigger('mouseenter');
      expect(wrapper.get(`[data-testid="image-delete-${itemId}"]`).attributes('style')).toContain(
        'opacity: 1'
      );

      await wrapper.get(`[data-testid="moodboard-image-${itemId}"]`).trigger('mouseleave');
      expect(wrapper.get(`[data-testid="image-delete-${itemId}"]`).attributes('style')).toContain(
        'opacity: 0'
      );
    });

    it('clicking the image delete icon opens the confirm modal without navigating away from the folder', async () => {
      const store = patchFolders();
      const { wrapper, router } = await mountMoodboard();
      await openFolder(wrapper);
      const itemId = store.folders[0].images[0].itemId;

      await wrapper.get(`[data-testid="moodboard-image-${itemId}"]`).trigger('mouseenter');
      await wrapper.get(`[data-testid="image-delete-${itemId}"]`).trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard/studio');
      expect(wrapper.find('[data-testid="delete-image-confirm"]').exists()).toBe(true);
    });

    it('successful delete removes only that image, leaving the rest of the folder untouched', async () => {
      deleteItemMock.mockResolvedValue(undefined);
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();
      await openFolder(wrapper);
      const [first, second] = store.folders[0].images;

      await wrapper.get(`[data-testid="moodboard-image-${first.itemId}"]`).trigger('mouseenter');
      await wrapper.get(`[data-testid="image-delete-${first.itemId}"]`).trigger('click');
      await wrapper.get('[data-testid="delete-image-confirm"]').trigger('click');
      await flushPromises();

      expect(deleteItemMock).toHaveBeenCalledWith({ folderId: 'folder-1', itemId: first.itemId });
      expect(store.folders[0].images.some((image) => image.itemId === first.itemId)).toBe(false);
      expect(store.folders[0].images.some((image) => image.itemId === second.itemId)).toBe(true);
      expect(wrapper.find('[data-testid="delete-image-confirm"]').exists()).toBe(false);
      expect(wrapper.find(`[data-testid="moodboard-image-${first.itemId}"]`).exists()).toBe(false);
    });

    it('keeps the modal open and the image intact on a failed delete, showing an error toast, and allows retry', async () => {
      deleteItemMock.mockRejectedValueOnce(new Error('boom'));
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();
      await openFolder(wrapper);
      const itemId = store.folders[0].images[0].itemId;

      await wrapper.get(`[data-testid="moodboard-image-${itemId}"]`).trigger('mouseenter');
      await wrapper.get(`[data-testid="image-delete-${itemId}"]`).trigger('click');
      await wrapper.get('[data-testid="delete-image-confirm"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="delete-image-confirm"]').exists()).toBe(true);
      expect(store.folders[0].images.some((image) => image.itemId === itemId)).toBe(true);
      expect(showToastMock).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to delete the image. Please try again.'
      });

      deleteItemMock.mockResolvedValueOnce(undefined);
      await wrapper.get('[data-testid="delete-image-confirm"]').trigger('click');
      await flushPromises();

      expect(store.folders[0].images.some((image) => image.itemId === itemId)).toBe(false);
      expect(wrapper.find('[data-testid="delete-image-confirm"]').exists()).toBe(false);
    });

    it('mobile always shows the image delete icon and can delete without hovering first', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true });
      deleteItemMock.mockResolvedValue(undefined);
      const store = patchFolders();
      const { wrapper } = await mountMoodboard();
      await wrapper.get('[data-testid="moodboard-folder-mobile-0"]').trigger('click');
      await flushPromises();
      const itemId = store.folders[0].images[0].itemId;

      await wrapper.get(`[data-testid="image-delete-mobile-${itemId}"]`).trigger('click');
      await wrapper.get('[data-testid="delete-image-confirm"]').trigger('click');
      await flushPromises();

      expect(deleteItemMock).toHaveBeenCalledWith({ folderId: 'folder-1', itemId });
      expect(store.folders[0].images.some((image) => image.itemId === itemId)).toBe(false);
    });

    it('removing an image from one folder never affects the same image saved in a different folder', async () => {
      deleteItemMock.mockResolvedValue(undefined);
      const sharedImage = (itemId: string) => ({
        itemId,
        id: 'shared-image',
        src: '/style-image/shared-image.webp',
        title: 'shared-image',
        styleGroup: 'minimal',
        style: [],
        createdAt: '2026-07-05T00:00:00.000Z'
      });
      useAuthStore().$patch({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          isAdmin: false,
          createdAt: '2026-07-01T00:00:00.000Z'
        }
      });
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        loadedProfileId: 'user-1',
        folders: [
          {
            id: 'folder-1',
            name: 'Studio',
            createdAt: '2026-07-06T00:00:00.000Z',
            images: [sharedImage('item-a')]
          },
          {
            id: 'folder-3',
            name: 'Archive',
            createdAt: '2026-07-05T00:00:00.000Z',
            images: [sharedImage('item-b')]
          }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await openFolder(wrapper);

      await wrapper.get('[data-testid="moodboard-image-item-a"]').trigger('mouseenter');
      await wrapper.get('[data-testid="image-delete-item-a"]').trigger('click');
      await wrapper.get('[data-testid="delete-image-confirm"]').trigger('click');
      await flushPromises();

      expect(deleteItemMock).toHaveBeenCalledTimes(1);
      expect(deleteItemMock).toHaveBeenCalledWith({ folderId: 'folder-1', itemId: 'item-a' });
      expect(store.folders.find((f) => f.id === 'folder-1')?.images).toEqual([]);
      expect(store.folders.find((f) => f.id === 'folder-3')?.images).toEqual([sharedImage('item-b')]);
    });
  });

  describe('detail photo navigation', () => {
    function patchSingleImageFolder(folderName = 'Studio') {
      useAuthStore().$patch({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          isAdmin: false,
          createdAt: '2026-07-01T00:00:00.000Z'
        }
      });
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        loadedProfileId: 'user-1',
        folders: [
          {
            id: 'folder-1',
            name: folderName,
            createdAt: '2026-07-06T00:00:00.000Z',
            images: [
              {
                itemId: 'item-1',
                id: 'image-1',
                src: '/style-image/image-1.webp',
                title: 'Image One',
                styleGroup: 'minimal',
                style: [],
                createdAt: '2026-07-06T00:00:00.000Z'
              }
            ]
          }
        ]
      });
      return store;
    }

    it('restores the folder detail view when mounting directly at a slugged moodboard URL', async () => {
      patchSingleImageFolder();
      const { wrapper } = await mountMoodboard('/moodboard/studio');
      await flushPromises();

      expect(wrapper.find('[data-testid="moodboard-detail-photo"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="moodboard-folder-0"]').isVisible()).toBe(false);
    });

    it('falls back to the folder list when mounting at a slug that matches no folder', async () => {
      patchSingleImageFolder();
      const { wrapper } = await mountMoodboard('/moodboard/no-such-folder');
      await flushPromises();

      expect(wrapper.find('[data-testid="moodboard-detail-photo"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="moodboard-folder-0"]').isVisible()).toBe(true);
    });

    it('restores the folder detail view when the folder name needs URL encoding', async () => {
      patchSingleImageFolder('Black & White');
      const { wrapper } = await mountMoodboard('/moodboard/black-%26-white');
      await flushPromises();

      expect(wrapper.find('[data-testid="moodboard-detail-photo"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="moodboard-folder-0"]').isVisible()).toBe(false);
    });

    it('navigates to the picture detail page when clicking a desktop detail photo', async () => {
      patchSingleImageFolder();
      const { wrapper, router } = await mountMoodboard();

      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('click');
      await flushPromises();

      const photoButton = wrapper.get('[data-testid="moodboard-detail-photo"]');
      expect(photoButton.attributes('disabled')).toBeUndefined();

      await photoButton.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/images/image-1');
      expect(router.currentRoute.value.query.moodboardSlug).toBe('studio');
    });

    it('navigates to the picture detail page when clicking a mobile detail photo', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchSingleImageFolder();
      const { wrapper, router } = await mountMoodboard();

      await wrapper.get('[data-testid="moodboard-folder-mobile-0"]').trigger('click');
      await flushPromises();

      const photoButton = wrapper.get('[data-testid="moodboard-mobile-photo"]');
      await photoButton.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/images/image-1');
      expect(router.currentRoute.value.query.moodboardSlug).toBe('studio');
    });

    it('only enables the one real photo among the mobile home preview placeholders', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchSingleImageFolder();
      const { wrapper } = await mountMoodboard();

      const photoButtons = wrapper.findAll('[data-testid="moodboard-mobile-photo"]');
      const enabledButtons = photoButtons.filter(
        (button) => button.attributes('disabled') === undefined
      );

      expect(photoButtons.length).toBeGreaterThan(1);
      expect(enabledButtons).toHaveLength(1);
    });
  });

  describe('sphere click navigation', () => {
    function patchSingleImageFolder() {
      useAuthStore().$patch({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          isAdmin: false,
          createdAt: '2026-07-01T00:00:00.000Z'
        }
      });
      const store = useMoodboardStore();
      store.$patch({
        status: 'success',
        loadedProfileId: 'user-1',
        folders: [
          {
            id: 'folder-1',
            name: 'Studio',
            createdAt: '2026-07-06T00:00:00.000Z',
            images: [
              {
                itemId: 'item-1',
                id: 'image-1',
                src: '/style-image/image-1.webp',
                title: 'Image One',
                styleGroup: 'minimal',
                style: [],
                createdAt: '2026-07-06T00:00:00.000Z'
              }
            ]
          }
        ]
      });
      return store;
    }

    function getSphereImageClickHandler(): (() => void) | undefined {
      return initSphere.mock.calls.at(-1)?.[4];
    }

    it('opens the folder shown on the sphere when the image-click callback fires', async () => {
      patchSingleImageFolder();
      const { router } = await mountMoodboard();
      await flushPromises();

      const handleImageClick = getSphereImageClickHandler();
      expect(handleImageClick).toBeTypeOf('function');

      handleImageClick?.();
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard/studio');
    });

    it('does nothing when no folder has any saved images', async () => {
      useAuthStore().$patch({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          isAdmin: false,
          createdAt: '2026-07-01T00:00:00.000Z'
        }
      });
      useMoodboardStore().$patch({
        status: 'success',
        loadedProfileId: 'user-1',
        folders: [
          { id: 'folder-1', name: 'Studio', createdAt: '2026-07-06T00:00:00.000Z', images: [] }
        ]
      });
      const { router } = await mountMoodboard();
      await flushPromises();

      getSphereImageClickHandler()?.();
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard');
    });

    it('opens the folder shown in the mobile home preview when clicking its one real photo', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchSingleImageFolder();
      const { wrapper, router } = await mountMoodboard();

      const photoButtons = wrapper.findAll('[data-testid="moodboard-mobile-photo"]');
      const realPhotoButton = photoButtons.find(
        (button) => button.attributes('disabled') === undefined
      );
      expect(realPhotoButton).toBeDefined();

      await realPhotoButton!.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard/studio');
    });
  });

  describe('folder directory click flow', () => {
    const savedImage = (id: string) => ({
      itemId: `item-${id}`,
      id,
      src: `/style-image/${id}.webp`,
      title: id,
      styleGroup: 'minimal',
      style: [],
      createdAt: '2026-07-05T00:00:00.000Z'
    });

    function patchTwoFolders() {
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
            id: 'oldest-folder',
            name: 'Oldest',
            createdAt: '2026-07-03T00:00:00.000Z',
            images: [savedImage('oldest-image')]
          }
        ]
      });
      return store;
    }

    it('clicking a folder directory item switches the sphere to that folder', async () => {
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      expect(initSphere.mock.calls.at(-1)?.[3][0].id).toBe('newest-image');

      await wrapper.get('[data-testid="folder-directory-item-oldest-folder"]').trigger('click');
      await flushPromises();

      expect(updateSphereImages.mock.calls.at(-1)?.[0][0].id).toBe('oldest-image');
    });

    it('clicking a folder directory item lights up the matching orbit tile', async () => {
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      await wrapper.get('[data-testid="folder-directory-item-oldest-folder"]').trigger('click');
      await flushPromises();

      expect(wrapper.get('[data-testid="moodboard-folder-1"] img').attributes('src')).toBe(
        '/images/folder-active.png'
      );
    });

    it('clicking a folder directory item lights up the matching mobile orbit tile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      await wrapper.get('[data-testid="folder-directory-item-oldest-folder"]').trigger('click');
      await flushPromises();

      expect(
        wrapper.get('[data-testid="moodboard-folder-mobile-1"] img').attributes('src')
      ).toBe('/images/folder-active.png');
    });

    it('clicking a folder directory item updates the mobile photo preview', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      const initialSources = wrapper
        .findAll('[data-testid="moodboard-mobile-photo"] img')
        .map((img) => img.attributes('src'));
      expect(initialSources).toContain('/style-image/newest-image.webp');

      await wrapper.get('[data-testid="folder-directory-item-oldest-folder"]').trigger('click');
      await flushPromises();

      const updatedSources = wrapper
        .findAll('[data-testid="moodboard-mobile-photo"] img')
        .map((img) => img.attributes('src'));
      expect(updatedSources).toContain('/style-image/oldest-image.webp');
      expect(updatedSources).not.toContain('/style-image/newest-image.webp');
    });

    it('clicking an empty folder in the directory does nothing', async () => {
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await flushPromises();
      const updateCount = updateSphereImages.mock.calls.length;

      await wrapper.get('[data-testid="folder-directory-item-empty-folder"]').trigger('click');
      await flushPromises();

      expect(updateSphereImages).toHaveBeenCalledTimes(updateCount);
    });

    it('hides the folder directory after opening a folder detail view', async () => {
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      expect(wrapper.find('[data-testid^="folder-directory-item-"]').exists()).toBe(true);

      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid^="folder-directory-item-"]').exists()).toBe(false);
    });
  });
});
