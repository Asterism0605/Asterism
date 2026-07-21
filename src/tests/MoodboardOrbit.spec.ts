import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useUserTour } from '@/composables/guide/useUserTour';

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

const mountedMoodboards: Array<{ unmount: () => void }> = [];

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
  mountedMoodboards.push(wrapper);

  return { wrapper, router };
}

const tourFolder = {
  id: 'tour-folder',
  name: 'Tour folder',
  createdAt: '2026-07-05T00:00:00.000Z',
  images: [
    {
      itemId: 'tour-item',
      id: 'tour-image',
      src: '/style-image/tour.webp',
      title: 'Tour image',
      styleGroup: 'minimal',
      style: [],
      createdAt: '2026-07-05T00:00:00.000Z'
    }
  ]
};

function prepareMoodboardTour(step: Parameters<ReturnType<typeof useUserTour>['advance']>[0]) {
  const authStore = useAuthStore();
  authStore.user = {
    id: 'user-1',
    email: 'member@example.com',
    displayName: 'Member',
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z'
  };
  useMoodboardStore().$patch({ status: 'success', loadedProfileId: 'user-1', folders: [tourFolder] });
  const tour = useUserTour('user-1');
  tour.enterChapter('moodboard', step);
  tour.resume();
  return tour;
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
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(0, 0, 120, 80)
    ] as unknown as DOMRectList);
  });

  afterEach(() => {
    mountedMoodboards.splice(0).forEach((wrapper) => wrapper.unmount());
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

  it('keeps free exploration opted out on a direct Moodboard visit', async () => {
    const tour = prepareMoodboardTour('moodboard-images');
    tour.optOut();
    await mountMoodboard();
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      enabled: false,
      status: 'idle',
      currentChapter: null,
      step: null
    });
    expect(document.querySelector('.driver-popover')).toBeNull();
  });

  it('pauses Chapter 2 instead of starting over an empty Moodboard', async () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 'user-1',
      email: 'member@example.com',
      displayName: 'Member',
      isAdmin: false,
      createdAt: '2026-01-01T00:00:00.000Z'
    };
    useMoodboardStore().$patch({ status: 'success', loadedProfileId: 'user-1', folders: [] });
    const tour = useUserTour('user-1');
    tour.enterChapter('moodboard', 'moodboard-images');
    tour.resume();
    await mountMoodboard();
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'paused',
      currentChapter: 'moodboard',
      step: 'moodboard-images'
    });
  });

  it('does not advance the directory step when a folder is hovered', async () => {
    prepareMoodboardTour('moodboard-directory');
    const { wrapper } = await mountMoodboard();
    await flushPromises();

    await wrapper.get('[data-testid="folder-directory-item-tour-folder"]').trigger('pointerenter');

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'moodboard-directory'
    });
  });

  it('uses bounded targets for the image cluster and directory list', async () => {
    prepareMoodboardTour('moodboard-images');
    const { wrapper } = await mountMoodboard();
    await flushPromises();

    expect(wrapper.get('[data-tour="moodboard-images"]').element.tagName).toBe('DIV');
    expect(wrapper.get('[data-tour="moodboard-directory"]').classes()).toContain(
      'folder-directory__list'
    );
  });

  it('advances the orbit step after an actual drag', async () => {
    prepareMoodboardTour('moodboard-orbit');
    const { wrapper } = await mountMoodboard();
    await flushPromises();
    const stage = wrapper.get('[data-testid="moodboard-stage-desktop"]');
    Object.defineProperty(stage.element, 'setPointerCapture', {
      configurable: true,
      value: vi.fn()
    });
    Object.defineProperty(stage.element, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn(() => false)
    });
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true });
    Object.defineProperties(pointerDown, {
      pointerId: { value: 21 },
      clientX: { value: 900 },
      clientY: { value: 100 }
    });
    const pointerMove = new Event('pointermove', { bubbles: true, cancelable: true });
    Object.defineProperties(pointerMove, {
      pointerId: { value: 21 },
      clientX: { value: 760 },
      clientY: { value: 220 }
    });
    const pointerUp = new Event('pointerup', { bubbles: true });
    Object.defineProperty(pointerUp, 'pointerId', { value: 21 });

    stage.element.dispatchEvent(pointerDown);
    stage.element.dispatchEvent(pointerMove);
    stage.element.dispatchEvent(pointerUp);
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'moodboard-folder'
    });
  });

  it('starts the orbit drag away from a folder and advances only once', async () => {
    prepareMoodboardTour('moodboard-orbit');
    const { wrapper } = await mountMoodboard();
    await flushPromises();
    const stage = wrapper.get('[data-testid="moodboard-stage-desktop"]');
    const pointer = (type: string, pointerId: number, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        pointerId: { value: pointerId },
        clientX: { value: clientX },
        clientY: { value: clientY }
      });
      return event;
    };

    stage.element.dispatchEvent(pointer('pointerdown', 31, 50, 500));
    stage.element.dispatchEvent(pointer('pointermove', 31, 120, 570));
    stage.element.dispatchEvent(pointer('pointerup', 31, 120, 570));
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      step: 'moodboard-folder'
    });

    useUserTour('user-1').advance('moodboard-orbit');
    stage.element.dispatchEvent(pointer('pointerleave', 31, 120, 570));

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'moodboard-orbit'
    });
  });

  it('does not open the center image during the orbit drag step', async () => {
    prepareMoodboardTour('moodboard-orbit');
    const { router } = await mountMoodboard();
    await flushPromises();

    const sphereClick = initSphere.mock.calls.at(-1)?.[4] as (() => void) | undefined;
    sphereClick?.();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/moodboard');
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'moodboard-orbit'
    });
  });

  it.each([
    ['desktop', 1024, 'moodboard-folder-0'],
    ['mobile', 375, 'moodboard-folder-mobile-0']
  ])('does not open an orbit folder on %s during the orbit drag step', async (_, width, testId) => {
    Object.defineProperty(window, 'innerWidth', {
      value: width,
      configurable: true,
      writable: true
    });
    prepareMoodboardTour('moodboard-orbit');
    const { wrapper, router } = await mountMoodboard();
    await flushPromises();

    await wrapper.get(`[data-testid="${testId}"]`).trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/moodboard');
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'moodboard-orbit'
    });
  });

  it('makes the whole orbit surface interactive during the drag step', async () => {
    prepareMoodboardTour('moodboard-orbit');
    const { wrapper } = await mountMoodboard();
    await flushPromises();

    const target = wrapper.get('[data-tour="moodboard-orbit"]');
    expect(target.element.tagName).toBe('DIV');
    expect(target.attributes('style')).toContain('cursor: grab');
  });

  it('uses directory copy without hover instructions on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    prepareMoodboardTour('moodboard-directory');
    await mountMoodboard();
    await flushPromises();

    const description = document.querySelector('.driver-popover-description')?.textContent ?? '';
    expect(description.toLowerCase()).not.toContain('hover');
    expect(description).toContain('Tap');
  });

  it('opens a valid folder into filters without completing the tour', async () => {
    prepareMoodboardTour('moodboard-folder');
    const { wrapper } = await mountMoodboard();
    await flushPromises();

    await wrapper.get('[data-testid="folder-directory-item-tour-folder"]').trigger('click');
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      currentChapter: 'moodboard',
      step: 'moodboard-filters'
    });
  });

  it('advances filters to the tour-control step without completing', async () => {
    prepareMoodboardTour('moodboard-folder');
    const { wrapper } = await mountMoodboard();
    await flushPromises();
    await wrapper.get('[data-testid="folder-directory-item-tour-folder"]').trigger('click');
    await flushPromises();
    const tourControl = document.createElement('button');
    tourControl.dataset.tour = 'moodboard-tour-control';
    document.body.append(tourControl);

    document.querySelector<HTMLButtonElement>('[data-testid="user-tour-next"]')?.click();
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      currentChapter: 'moodboard',
      step: 'moodboard-tour-control'
    });
  });

  it('enters the completion transition from the final Done action', async () => {
    prepareMoodboardTour('moodboard-tour-control');
    const tourControl = document.createElement('button');
    tourControl.dataset.tour = 'moodboard-tour-control';
    document.body.append(tourControl);
    const { wrapper } = await mountMoodboard();
    await flushPromises();

    document.querySelector<HTMLButtonElement>('[data-testid="user-tour-next"]')?.click();
    await flushPromises();

    expect(wrapper.find('[data-testid="tour-transition"]').exists()).toBe(true);
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'transition',
      currentChapter: 'moodboard',
      step: null
    });
  });

  it('restarts the completed tour from home', async () => {
    const tour = prepareMoodboardTour('moodboard-tour-control');
    tour.completeChapter('moodboard');
    const { wrapper, router } = await mountMoodboard('/moodboard/tour-folder');

    await wrapper.get('[data-testid="tour-transition-proceed"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('home');
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      currentChapter: 'exploration',
      step: 'home-overview'
    });
  });

  it('persists completion without leaving the open folder', async () => {
    const tour = prepareMoodboardTour('moodboard-tour-control');
    tour.completeChapter('moodboard');
    const { wrapper, router } = await mountMoodboard('/moodboard/tour-folder');

    await wrapper.get('[data-testid="tour-transition-later"]').trigger('click');

    expect(router.currentRoute.value.fullPath).toBe('/moodboard/tour-folder');
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'completed',
      currentChapter: null,
      step: null
    });
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

  it('previews placeholders for an empty folder, stays until another folder is hovered', async () => {
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

    await wrapper.get('[data-testid="moodboard-folder-2"]').trigger('mouseleave');
    await wrapper.get('[data-testid="moodboard-folder-1"]').trigger('mouseenter');
    await flushPromises();

    const placeholderImages = updateSphereImages.mock.calls.at(-1)?.[0];
    expect(placeholderImages).toHaveLength(20);
    expect(placeholderImages.every((image: { isPlaceholder: boolean }) => image.isPlaceholder)).toBe(
      true
    );

    // leaving the empty folder shouldn't switch the preview away from the placeholders
    await wrapper.get('[data-testid="moodboard-folder-1"]').trigger('mouseleave');
    await flushPromises();
    expect(
      updateSphereImages.mock.calls
        .at(-1)?.[0]
        .every((image: { isPlaceholder: boolean }) => image.isPlaceholder)
    ).toBe(true);

    // hovering a different folder switches the preview again
    await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('mouseenter');
    await flushPromises();
    expect(updateSphereImages.mock.calls.at(-1)?.[0][0].id).toBe('newest-image');
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

    it('dims a folder that has no saved images and does not open it on click', async () => {
      patchFolders();
      const { wrapper, router } = await mountMoodboard();

      const emptyFolder = wrapper.get('[data-testid="moodboard-folder-1"]');
      expect(emptyFolder.get('img').attributes('style')).toContain('grayscale(1)');

      await emptyFolder.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/moodboard');
    });

    it('does not dim a folder that has saved images', async () => {
      patchFolders();
      const { wrapper } = await mountMoodboard();

      const populatedFolder = wrapper.get('[data-testid="moodboard-folder-0"]');
      expect(populatedFolder.get('img').attributes('style')).not.toContain('grayscale(1)');
    });

    it('previews an orbit folder on hover without snapping the folder away from the pointer', async () => {
      patchFolders();
      const { wrapper } = await mountMoodboard();
      const folder = wrapper.get('[data-testid="moodboard-folder-0"]');
      const element = folder.element as HTMLElement;
      const initialPosition = { left: element.style.left, top: element.style.top };

      await folder.trigger('mouseenter');
      await flushPromises();

      expect(element.style.left).toBe(initialPosition.left);
      expect(element.style.top).toBe(initialPosition.top);
      expect(folder.get('img').attributes('src')).toBe('/images/folder-active.png');
    });

    it('keeps a folder click on the folder when the pointer was not dragged', async () => {
      patchFolders();
      const { wrapper, router } = await mountMoodboard();
      const scale = window.innerWidth / 1440;
      const stage = wrapper.get('[data-testid="moodboard-stage-desktop"]');
      const setPointerCapture = vi.fn();
      Object.defineProperty(stage.element, 'setPointerCapture', {
        configurable: true,
        value: setPointerCapture
      });
      const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true });
      Object.defineProperties(pointerDown, {
        pointerId: { value: 6 },
        clientX: { value: 980 * scale },
        clientY: { value: 50 * scale }
      });
      const pointerUp = new Event('pointerup', { bubbles: true });
      Object.defineProperty(pointerUp, 'pointerId', { value: 6 });

      stage.element.dispatchEvent(pointerDown);
      stage.element.dispatchEvent(pointerUp);
      await wrapper.get('[data-testid="moodboard-folder-0"]').trigger('click');
      await flushPromises();

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(router.currentRoute.value.path).toBe('/moodboard/studio');
    });

    it('ignores orbit hover previews while the user is dragging the track', async () => {
      patchFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();
      const updateCount = updateSphereImages.mock.calls.length;
      const scale = window.innerWidth / 1440;
      const stage = wrapper.get('[data-testid="moodboard-stage-desktop"]');
      const rectSpy = vi.spyOn(stage.element, 'getBoundingClientRect');
      const setPointerCapture = vi.fn();
      Object.defineProperty(stage.element, 'setPointerCapture', {
        configurable: true,
        value: setPointerCapture
      });
      const draggedFolder = wrapper.get('[data-testid="moodboard-folder-0"]');
      const initialLeft = (draggedFolder.element as HTMLElement).style.left;
      const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true });
      Object.defineProperties(pointerDown, {
        pointerId: { value: 7 },
        clientX: { value: 980 * scale },
        clientY: { value: 50 * scale }
      });

      stage.element.dispatchEvent(pointerDown);
      await flushPromises();
      const pointerMove = new Event('pointermove', { bubbles: true, cancelable: true });
      Object.defineProperties(pointerMove, {
        pointerId: { value: 7 },
        clientX: { value: (980 + 500 * Math.cos((-80 * Math.PI) / 180)) * scale },
        clientY: { value: (550 + 500 * Math.sin((-80 * Math.PI) / 180)) * scale }
      });
      stage.element.dispatchEvent(pointerMove);
      await wrapper.get('[data-testid="moodboard-folder-1"]').trigger('mouseenter');
      await flushPromises();

      expect(updateSphereImages).toHaveBeenCalledTimes(updateCount);
      expect(wrapper.find('[data-testid="moodboard-empty-folder-preview-cta"]').exists()).toBe(
        false
      );

      const pointerUp = new Event('pointerup', { bubbles: true });
      Object.defineProperty(pointerUp, 'pointerId', { value: 7 });
      stage.element.dispatchEvent(pointerUp);
      await flushPromises();

      expect(rectSpy).toHaveBeenCalledOnce();
      expect(setPointerCapture).toHaveBeenCalledWith(7);
      expect((draggedFolder.element as HTMLElement).style.left).not.toBe(initialLeft);
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
      const homeIcon = wrapper.get('[data-testid="moodboard-folder-mobile-0"]');
      await homeIcon.trigger('pointerenter');
      await homeIcon.trigger('click');
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

      const homeIcon = wrapper.get('[data-testid="moodboard-folder-mobile-0"]');
      await homeIcon.trigger('pointerenter');
      await homeIcon.trigger('click');
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

    it('clicking a folder directory item opens that folder detail view', async () => {
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      await wrapper.get('[data-testid="folder-directory-item-oldest-folder"]').trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard/oldest');
      expect(wrapper.find('[data-testid^="folder-directory-item-"]').exists()).toBe(false);
    });

    it('clicking an empty folder directory item does not open a detail view', async () => {
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      await wrapper.get('[data-testid="folder-directory-item-empty-folder"]').trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard');
      expect(wrapper.find('[data-testid^="folder-directory-item-"]').exists()).toBe(true);
    });

    it('on mobile, the first click on a non-previewed folder just switches the preview', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      const item = wrapper.get('[data-testid="folder-directory-item-oldest-folder"]');
      await item.trigger('pointerenter');
      await item.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard');
      expect(item.classes()).toContain('folder-node--active');
    });

    it('on mobile, tapping the already-previewed folder a second time opens its detail view', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      const item = wrapper.get('[data-testid="folder-directory-item-oldest-folder"]');
      await item.trigger('pointerenter');
      await item.trigger('click');
      await flushPromises();
      await item.trigger('pointerenter');
      await item.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard/oldest');
    });

    it('on mobile, tapping the folder that is already the default preview opens it on the first tap', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      const item = wrapper.get('[data-testid="folder-directory-item-newest-folder"]');
      await item.trigger('pointerenter');
      await item.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard/newest');
    });

    it('on mobile, a single click with no preceding pointerenter still needs a second tap to open (no self-arming race)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      const item = wrapper.get('[data-testid="folder-directory-item-oldest-folder"]');
      await item.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard');
    });

    it('on mobile, the orbit ring folder icon also needs a second tap on the same folder to open it', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      const ringIcon = wrapper.get('[data-testid="moodboard-folder-mobile-1"]');
      await ringIcon.trigger('pointerenter');
      await ringIcon.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/moodboard');

      await ringIcon.trigger('pointerenter');
      await ringIcon.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/moodboard/oldest');
    });

    it('on mobile, the orbit ring icon keeps showing the active image after the finger lifts', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      const ringIcon = wrapper.get('[data-testid="moodboard-folder-mobile-1"]');
      await ringIcon.trigger('pointerenter');
      await ringIcon.trigger('click');
      await flushPromises();
      await ringIcon.trigger('pointerleave');
      await flushPromises();

      expect(ringIcon.get('img').attributes('src')).toBe('/images/folder-active.png');
    });

    it('going back home resets the preview back to the default folder', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper, router } = await mountMoodboard();
      await flushPromises();

      const ringIcon = wrapper.get('[data-testid="moodboard-folder-mobile-1"]');
      await ringIcon.trigger('pointerenter');
      await ringIcon.trigger('click');
      await flushPromises();
      await ringIcon.trigger('pointerenter');
      await ringIcon.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/moodboard/oldest');

      const backButton = wrapper.findAll('button').find((button) => button.text().includes('Back'));
      expect(backButton).toBeDefined();
      await backButton!.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.path).toBe('/moodboard');
      expect(wrapper.get('[data-testid="moodboard-folder-mobile-0"] img').attributes('src')).toBe(
        '/images/folder-active.png'
      );
      expect(
        wrapper.get('[data-testid="moodboard-folder-mobile-1"] img').attributes('src')
      ).toBe('/images/folder-idle.png');
    });

    it('hovering a folder directory item switches the sphere preview to that folder', async () => {
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      expect(initSphere.mock.calls.at(-1)?.[3][0].id).toBe('newest-image');

      await wrapper
        .get('[data-testid="folder-directory-item-oldest-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      expect(updateSphereImages.mock.calls.at(-1)?.[0][0].id).toBe('oldest-image');
    });

    it('hovering a folder directory item lights up the matching orbit tile', async () => {
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      await wrapper
        .get('[data-testid="folder-directory-item-oldest-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      expect(wrapper.get('[data-testid="moodboard-folder-1"] img').attributes('src')).toBe(
        '/images/folder-active.png'
      );
    });

    it('hovering an empty folder directory item previews 20 placeholder images', async () => {
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      await wrapper
        .get('[data-testid="folder-directory-item-empty-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      const lastImages = updateSphereImages.mock.calls.at(-1)?.[0];
      expect(lastImages).toHaveLength(20);
      expect(lastImages.every((image: { isPlaceholder: boolean }) => image.isPlaceholder)).toBe(
        true
      );
    });

    it('hovering an empty folder directory item shows the start-exploring CTA over the sphere', async () => {
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      expect(
        wrapper.find('[data-testid="moodboard-empty-folder-preview-cta"]').exists()
      ).toBe(false);

      await wrapper
        .get('[data-testid="folder-directory-item-empty-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      const cta = wrapper.get('[data-testid="moodboard-empty-folder-preview-cta"]');
      expect(cta.text()).toBe('Start Exploring');

      await wrapper
        .get('[data-testid="folder-directory-item-newest-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      expect(
        wrapper.find('[data-testid="moodboard-empty-folder-preview-cta"]').exists()
      ).toBe(false);
    });

    it('leaving an empty folder directory item keeps the placeholder preview until another folder is hovered', async () => {
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      const emptyItem = wrapper.get('[data-testid="folder-directory-item-empty-folder"]');
      await emptyItem.trigger('pointerenter');
      await flushPromises();
      await emptyItem.trigger('pointerleave');
      await flushPromises();

      expect(
        updateSphereImages.mock.calls
          .at(-1)?.[0]
          .every((image: { isPlaceholder: boolean }) => image.isPlaceholder)
      ).toBe(true);

      await wrapper
        .get('[data-testid="folder-directory-item-newest-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      expect(updateSphereImages.mock.calls.at(-1)?.[0][0].id).toBe('newest-image');
    });

    it('hovering a folder directory item on mobile does not change the sphere preview', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      patchTwoFolders();
      const { wrapper } = await mountMoodboard();
      await flushPromises();
      const updateCount = updateSphereImages.mock.calls.length;

      await wrapper
        .get('[data-testid="folder-directory-item-oldest-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      expect(updateSphereImages).toHaveBeenCalledTimes(updateCount);
    });

    it('hovering a folder directory item on mobile switches the mobile photo preview to that folder', async () => {
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

      await wrapper
        .get('[data-testid="folder-directory-item-oldest-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      const updatedSources = wrapper
        .findAll('[data-testid="moodboard-mobile-photo"] img')
        .map((img) => img.attributes('src'));
      expect(updatedSources).toContain('/style-image/oldest-image.webp');
      expect(updatedSources).not.toContain('/style-image/newest-image.webp');
    });

    it('hovering an empty folder directory item on mobile previews placeholders and shows the start-exploring CTA', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      expect(
        wrapper.find('[data-testid="moodboard-empty-folder-preview-cta-mobile"]').exists()
      ).toBe(false);

      await wrapper
        .get('[data-testid="folder-directory-item-empty-folder"]')
        .trigger('pointerenter');
      await flushPromises();

      const photoCards = wrapper.findAll('[data-testid="moodboard-mobile-photo"]');
      expect(photoCards.length).toBeGreaterThan(0);
      photoCards.forEach((card) => {
        expect(card.element.parentElement?.className).toContain('photo-placeholder');
      });

      const cta = wrapper.get('[data-testid="moodboard-empty-folder-preview-cta-mobile"]');
      expect(cta.text()).toBe('Start Exploring');
    });

    it('tapping an empty orbit tile on mobile previews placeholders too', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
        writable: true
      });
      const store = patchTwoFolders();
      store.$patch({
        folders: [
          ...store.folders,
          { id: 'empty-folder', name: 'Empty', createdAt: '2026-07-07T00:00:00.000Z', images: [] }
        ]
      });
      const { wrapper } = await mountMoodboard();
      await flushPromises();

      // 手機沒有 hover，空資料夾的預覽/CTA 只能靠實際點擊觸發（第一次點擊即預覽，不需要開啟）。
      await wrapper.get('[data-testid="moodboard-folder-mobile-2"]').trigger('click');
      await flushPromises();

      expect(
        wrapper.get('[data-testid="moodboard-empty-folder-preview-cta-mobile"]').text()
      ).toBe('Start Exploring');
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
