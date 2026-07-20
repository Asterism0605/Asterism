import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import PictureDetail from '@/pages/PictureDetail.vue'
import StyleTagModal from '@/components/feature/dna/StyleTagModal.vue'
import { getRelatedImages } from '@/services/image.service'
import { addItem, createFolder } from '@/services/moodboard.service'
import { showToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { useMoodboardStore } from '@/stores/moodboard.store'
import { savePendingMoodboardAction } from '@/services/pendingMoodboardAction.service'
import { useUserTour } from '@/composables/guide/useUserTour'
import type { MoodboardFolder, SavedImage } from '@/types/moodboard'

vi.mock('@/services/moodboard.service', () => ({
  addItem: vi.fn(),
  createFolder: vi.fn(),
  isImageSaved: vi.fn(() => false)
}))

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn(),
  hideToast: vi.fn(),
  useToast: () => ({ toast: { value: null } })
}))

vi.mock('@/components/feature/image/ImageStagePanel.vue', () => ({
  default: {
    emits: ['select', 'back'],
    template:
      '<div data-test="image-stage-panel" @click="$emit(\'select\', \'ftdp-graphic-poster-001\')">' +
      '<div data-test="image-stage-back" @click.stop="$emit(\'back\')" />' +
      '</div>'
  }
}))

vi.mock('@/components/feature/guide/TourTransition.vue', () => ({
  default: {
    props: ['title', 'description', 'proceedLabel', 'laterLabel'],
    emits: ['proceed', 'later'],
    template:
      '<div data-testid="tour-transition"><button data-testid="tour-transition-proceed" @click="$emit(\'proceed\')" /><button data-testid="tour-transition-later" @click="$emit(\'later\')" /></div>'
  }
}))

const fakeUser = {
  id: 'user-1',
  email: 'member@example.com',
  displayName: 'Member',
  isAdmin: false,
  createdAt: '2026-01-01T00:00:00Z'
}
const testFolder: MoodboardFolder = {
  id: 'folder-1',
  name: 'test',
  createdAt: '2026-07-05T00:00:00.000Z',
  images: []
}
const testSavedImage: SavedImage = {
  itemId: 'item-1',
  id: 'y2k-main-001',
  src: '/style-image/y2k-main-001.webp',
  title: 'Saved image',
  styleGroup: 'y2k',
  style: [],
  createdAt: '2026-07-05T00:00:00.000Z'
}

async function mountPictureDetail(
  imageId = 'y2k-main-001',
  isAuthenticated = true,
  options: { attachTo?: HTMLElement } = {}
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/images/:imageId', name: 'picture-detail', component: PictureDetail },
      { path: '/images/:imageId/spread', name: 'image-spread', component: { template: '<div />' } },
      { path: '/search-by-image', name: 'image-search', component: { template: '<div />' } },
      { path: '/consultant', name: 'consultant', component: { template: '<div />' } },
      { path: '/sign-up', name: 'sign-up', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/moodboard/:slug?', name: 'moodboard', component: { template: '<div />' } }
    ]
  })
  const pinia = createPinia()
  const authStore = useAuthStore(pinia)

  if (isAuthenticated) {
    authStore.user = fakeUser
    authStore.session = {
      user: fakeUser,
      accessToken: 'test-token',
      expiresAt: '2026-01-01T01:00:00Z'
    }
  }

  const moodboardStore = useMoodboardStore(pinia)
  moodboardStore.$patch({
    status: 'success',
    loadedProfileId: 'user-1',
    folders: [{ ...testFolder, images: [] }]
  })
  const folderId = testFolder.id

  await router.push(`/images/${imageId}`)
  await router.isReady()

  const wrapper = mount(PictureDetail, {
    attachTo: options.attachTo,
    global: { plugins: [router, pinia] }
  })

  return { router, wrapper, folderId }
}

describe('PictureDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().user = fakeUser
    useMoodboardStore().$patch({
      status: 'success',
      loadedProfileId: 'user-1',
      folders: []
    })
    vi.mocked(addItem).mockResolvedValue(testSavedImage)
    vi.mocked(createFolder).mockResolvedValue({ ...testFolder, id: 'new-folder-id', images: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    })
  })

  it('本地圖（attribution=Asterism）顯示 Asterism 站徽當作者頭像', async () => {
    const { wrapper } = await mountPictureDetail();

    expect(wrapper.text()).toContain('Asterism');
    const avatarImgs = wrapper.findAll('img[alt="Asterism"]');
    expect(avatarImgs.length).toBeGreaterThan(0);
    expect(avatarImgs[0].attributes('src')).toBe('/sitelogo.png');
  });

  it('本地圖（沒有 sourceUrl）不顯示 SOURCE URL 連結', async () => {
    const { wrapper } = await mountPictureDetail();

    expect(wrapper.find('a[target="_blank"]').exists()).toBe(false);
  });

  it('儲存進行中時停用 ADD TO MOODBOARD，完成後重新啟用', async () => {
    let resolve!: (image: SavedImage) => void
    vi.mocked(addItem).mockImplementationOnce(
      () =>
        new Promise<SavedImage>((r) => {
          resolve = r
        })
    )
    const { wrapper } = await mountPictureDetail()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'))
    await addBtn!.trigger('click')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'))
    await saveBtn!.trigger('click')
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test')
    await folderBtn!.trigger('click')

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(true)

    resolve(testSavedImage)
    await flushPromises()

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(false)
    expect(addItem).toHaveBeenCalledOnce()
  })

  it('keeps the tour active when the thumbnail target is not mounted yet', async () => {
    const rects = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(100, 100, 200, 300)
    ] as unknown as DOMRectList)
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.advance('detail-thumbnail', 'y2k-main-001')
    const host = document.createElement('div')
    document.body.append(host)
    const { wrapper } = await mountPictureDetail('y2k-main-001', true, { attachTo: host })
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'detail-thumbnail'
    })

    wrapper.unmount()
    host.remove()
    rects.mockRestore()
  })

  it('skips the hidden thumbnail step on mobile and continues with style tags', async () => {
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375
    })
    const rects = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(100, 100, 200, 300)
    ] as unknown as DOMRectList)
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.advance('detail-thumbnail', 'y2k-main-001')
    const host = document.createElement('div')
    document.body.append(host)
    const { wrapper } = await mountPictureDetail('y2k-main-001', true, { attachTo: host })
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'detail-style-tag'
    })
    expect(document.querySelector('.asterism-tour-popover')?.textContent).toContain('6 / 8')

    wrapper.unmount()
    host.remove()
    rects.mockRestore()
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth
    })
  })

  it('continues from the desktop thumbnail through consultant awareness and save', async () => {
    const rects = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(100, 100, 200, 300)
    ] as unknown as DOMRectList)
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.advance('detail-thumbnail', 'y2k-main-001')
    const visibleThumbnailTarget = document.createElement('button')
    visibleThumbnailTarget.dataset.tour = 'detail-thumbnail'
    const host = document.createElement('div')
    document.body.append(visibleThumbnailTarget, host)
    const { wrapper } = await mountPictureDetail('y2k-main-001', true, { attachTo: host })
    await flushPromises()

    expect(document.querySelector('.asterism-tour-popover')?.textContent).toContain('5 / 8')
    await wrapper.get('[data-test="image-stage-panel"]').trigger('click')
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'detail-style-tag'
    })
    expect(document.querySelector('.asterism-tour-popover')?.textContent).toContain('6 / 8')

    await wrapper.get('[data-tour="detail-style-tag"] button').trigger('click')
    wrapper.findComponent(StyleTagModal).vm.$emit('update:modelValue', false)
    await flushPromises()
    expect(document.querySelector('.asterism-tour-popover')?.textContent).toContain('7 / 8')

    document.querySelector<HTMLButtonElement>('[data-testid="user-tour-next"]')?.click()
    await flushPromises()

    expect(document.querySelector('.asterism-tour-popover')?.textContent).toContain('8 / 8')
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'detail-save'
    })

    wrapper.unmount()
    visibleThumbnailTarget.remove()
    host.remove()
    rects.mockRestore()
  })

  it('點擊 SAVE TO FOLDER 時以目前圖片 id 呼叫 addItem', async () => {
    const { wrapper, folderId } = await mountPictureDetail()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'))
    await addBtn!.trigger('click')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'))
    await saveBtn!.trigger('click')
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test')
    await folderBtn!.trigger('click')

    expect(addItem).toHaveBeenCalledOnce()
    expect(addItem).toHaveBeenCalledWith(folderId, 'y2k-main-001')
  })

  it('當 addItem 拋出錯誤時顯示錯誤提示', async () => {
    vi.mocked(addItem).mockImplementationOnce(() => {
      throw new Error('save failed')
    })
    const { wrapper } = await mountPictureDetail()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'))
    await addBtn!.trigger('click')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'))
    await saveBtn!.trigger('click')
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test')
    await folderBtn!.trigger('click')
    await flushPromises()

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('點擊 consult 時帶著來源圖片 id 導向 consultant', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001')

    const consultBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CONSULT STYLIST'))
    await consultBtn!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('consultant')
    expect(router.currentRoute.value.query.sourceImageId).toBe('rpl-interior-lighting-001')
  })

  it('completes exploration and shows the Moodboard transition only after saving succeeds', async () => {
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.advance('detail-save', 'y2k-main-001')

    const { wrapper, folderId } = await mountPictureDetail()
    await wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'))!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'))!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'test')!.trigger('click')
    await flushPromises()

    expect(addItem).toHaveBeenCalledWith(folderId, 'y2k-main-001')
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'transition',
      currentChapter: 'exploration',
      completedChapters: ['exploration']
    })
    expect(wrapper.find('[data-testid="tour-transition"]').exists()).toBe(true)
  })

  it('does not leave Picture Detail when Escape is pressed during the chapter transition', async () => {
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.advance('detail-save', 'y2k-main-001')
    tour.completeChapter('exploration')

    const { router, wrapper } = await mountPictureDetail()
    await flushPromises()
    const routeBeforeEscape = router.currentRoute.value.fullPath

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe(routeBeforeEscape)
    expect(tour.state.value.status).toBe('transition')
    expect(wrapper.find('[data-testid="tour-transition"]').exists()).toBe(true)
  })

  it('starts Moodboard Chapter 2 only from the transition proceed action', async () => {
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.completeChapter('exploration')
    const { router, wrapper } = await mountPictureDetail()

    await wrapper.get('[data-testid="tour-transition-proceed"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('moodboard')
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      currentChapter: 'moodboard',
      step: 'moodboard-images'
    })
  })

  it('keeps Moodboard Chapter 2 paused when continuing later', async () => {
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.completeChapter('exploration')
    const { router, wrapper } = await mountPictureDetail()

    await wrapper.get('[data-testid="tour-transition-later"]').trigger('click')

    expect(router.currentRoute.value.name).toBe('picture-detail')
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'paused',
      currentChapter: 'moodboard',
      step: 'moodboard-images'
    })
  })

  it('does not complete exploration when saving fails', async () => {
    vi.mocked(addItem).mockRejectedValueOnce(new Error('save failed'))
    const tour = useUserTour('user-1')
    tour.start('y2k-main-001')
    tour.advance('detail-save', 'y2k-main-001')

    const { wrapper } = await mountPictureDetail()
    await wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'))!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'))!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'test')!.trigger('click')
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'paused',
      step: 'detail-save',
      completedChapters: []
    })
    expect(wrapper.find('[data-testid="tour-transition"]').exists()).toBe(false)
  })

  it('routes unauthenticated consult clicks to sign-up with the consultant target', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001', false)

    const consultBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CONSULT STYLIST'))
    await consultBtn!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('sign-up')
    expect(router.currentRoute.value.query.next).toBe(
      '/consultant?sourceImageId=rpl-interior-lighting-001'
    )
  })

  it('routes unauthenticated moodboard clicks to login with the current image target', async () => {
    const { router, wrapper } = await mountPictureDetail('y2k-main-001', false)

    const addButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('ADD TO MOODBOARD'))
    await addButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.next).toBe('/images/y2k-main-001')
    expect(addItem).not.toHaveBeenCalled()
    expect(createFolder).not.toHaveBeenCalled()
  })

  it('reopens the save menu once after returning authenticated', async () => {
    savePendingMoodboardAction('y2k-main-001', '/images/y2k-main-001')

    const { wrapper } = await mountPictureDetail()
    await flushPromises()

    expect(wrapper.text()).toContain('SAVE TO NEW FOLDER')
    expect(localStorage.getItem('asterism:pending-moodboard-action')).toBeNull()
  })

  it('點 stage 面板空白區（背景）觸發返回，跟右側返回鍵同一套邏輯', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-001');

    await wrapper.find('[data-test="image-stage-back"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001');
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001');
  });

  it('導向選取的 stage 圖片詳情頁', async () => {
    const { router, wrapper } = await mountPictureDetail()

    await wrapper.find('[data-test="image-stage-panel"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('picture-detail')
    expect(router.currentRoute.value.params.imageId).toBe('ftdp-graphic-poster-001')
  })

  it('點擊風格標籤開啟說明 modal（una-hsieh review：詳情頁標籤也須可點擊）', async () => {
    // StyleTagModal 用 <Teleport to="body">，內容會搬到 document.body，
    // 不在 wrapper 自己的渲染樹底下，故直接查 document（跟下面 CREATE FOLDER
    // modal 那個既有測試查 document.querySelector 是同一招）。
    const { wrapper } = await mountPictureDetail(undefined, true, { attachTo: document.body })

    const tagBtn = wrapper.findAll('button').find((b) => b.text() === 'Y2K')
    await tagBtn!.trigger('click')
    await flushPromises()

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain(
      'Y2K is a visual style rooted in early-2000s technological optimism'
    )

    wrapper.unmount()
  })

  it('導向選取的相似圖片詳情頁', async () => {
    const { router, wrapper } = await mountPictureDetail()
    const expectedImageId = getRelatedImages('y2k-main-001', { limit: 6 })[2].id

    await wrapper.find('div.grid button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('picture-detail')
    expect(router.currentRoute.value.params.imageId).toBe(expectedImageId)
  })

  it('帶著 style group 的 root id 回到 image spread 頁', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-001')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('image-spread')
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001')
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001')
  })

  it('按 Esc 不用先聚焦任何區塊就能返回（跟點返回按鈕效果一致）', async () => {
    const { router } = await mountPictureDetail('rpl-interior-001')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('image-spread')
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001')
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001')
  })

  it('將 sub-medium 詳情圖片返回其 medium spread 入口', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('image-spread')
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001')
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001')
  })

  it('從以圖搜圖頁進來的詳情頁，返回鍵回以圖搜圖頁而不是探索頁', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-001?from=image-search')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('image-search')
  })

  it('重開 SAVE TO NEW FOLDER modal 後 input 不再 disabled', async () => {
    vi.useFakeTimers();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/images/:imageId', name: 'picture-detail', component: PictureDetail },
        {
          path: '/images/:imageId/spread',
          name: 'image-spread',
          component: { template: '<div />' }
        },
        { path: '/consultant', name: 'consultant', component: { template: '<div />' } }
      ]
    });
    await router.push('/images/y2k-main-001');
    await router.isReady();

    const wrapper = mount(PictureDetail, {
      attachTo: document.body,
      global: { plugins: [router] }
    });

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!;

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('SAVE TO NEW FOLDER').trigger('click');
      await flushPromises();

      const input = document.querySelector('input') as HTMLInputElement;
      input.value = 'My Folder';
      input.dispatchEvent(new Event('input'));
      await flushPromises();

      const sendBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('SEND')
      ) as HTMLButtonElement;
      sendBtn.click();
      await flushPromises();
      vi.advanceTimersByTime(800);
      await flushPromises();

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('SAVE TO NEW FOLDER').trigger('click');
      await flushPromises();

      expect((document.querySelector('input') as HTMLInputElement).disabled).toBe(false);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('有符合目前圖片的 spread path context 時返回原本路徑上的 spread target', async () => {
    const { router, wrapper } = await mountPictureDetail(
      'ftdp-graphic-poster-001?spreadImageId=ftdp-graphic-001&spreadRootId=ftdp-main-001&spreadDetailImageId=ftdp-graphic-poster-001'
    )

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('image-spread')
    expect(router.currentRoute.value.params.imageId).toBe('ftdp-graphic-001')
    expect(router.currentRoute.value.query.rootId).toBe('ftdp-main-001')
  })

  it('spread path context 不符合目前圖片時，返回目前圖片自己的 spread 路徑', async () => {
    const { router, wrapper } = await mountPictureDetail(
      'ftdp-graphic-poster-001?spreadImageId=ftdp-graphic-brand-001&spreadRootId=ftdp-main-001&spreadDetailImageId=ftdp-graphic-brand-001'
    )

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('image-spread')
    expect(router.currentRoute.value.params.imageId).toBe('ftdp-graphic-001')
    expect(router.currentRoute.value.query.rootId).toBe('ftdp-main-001')
  })

  it('帶著 moodboardSlug query 時，返回按鈕導回該 moodboard 資料夾', async () => {
    const { router, wrapper } = await mountPictureDetail('y2k-main-001?moodboardSlug=studio')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('moodboard')
    expect(router.currentRoute.value.params.slug).toBe('studio')
  })

  it('在詳情頁切換圖片時將 spread path context 改指向下一張圖片', async () => {
    const { router, wrapper } = await mountPictureDetail(
      'ftdp-graphic-brand-001?spreadImageId=ftdp-graphic-001&spreadRootId=ftdp-main-001&spreadDetailImageId=ftdp-graphic-brand-001'
    )

    await wrapper.find('[data-test="image-stage-panel"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('picture-detail')
    expect(router.currentRoute.value.params.imageId).toBe('ftdp-graphic-poster-001')
    expect(router.currentRoute.value.query).toEqual({
      spreadImageId: 'ftdp-graphic-001',
      spreadDetailImageId: 'ftdp-graphic-poster-001',
      spreadRootId: 'ftdp-main-001'
    })
  })

  it('送出 SAVE TO NEW FOLDER 時，以新資料夾 id 與目前圖片 id 呼叫 addItem', async () => {
    vi.mocked(createFolder).mockResolvedValueOnce({
      ...testFolder,
      id: 'new-folder-id',
      images: []
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/images/:imageId', name: 'picture-detail', component: PictureDetail },
        {
          path: '/images/:imageId/spread',
          name: 'image-spread',
          component: { template: '<div />' }
        },
        { path: '/consultant', name: 'consultant', component: { template: '<div />' } }
      ]
    })
    await router.push('/images/y2k-main-001')
    await router.isReady()

    const wrapper = mount(PictureDetail, {
      attachTo: document.body,
      global: { plugins: [router] }
    })

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!

      await findBtn('ADD TO MOODBOARD').trigger('click')
      await findBtn('SAVE TO NEW FOLDER').trigger('click')
      await flushPromises()

      const input = document.querySelector('input') as HTMLInputElement
      input.value = 'My Folder'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const sendBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('SEND')
      ) as HTMLButtonElement
      sendBtn.click()
      await flushPromises()

      expect(createFolder).toHaveBeenCalledWith('user-1', 'My Folder', [])
      expect(addItem).toHaveBeenCalledWith('new-folder-id', 'y2k-main-001')
    } finally {
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('createFolder 成功但 addItem 失敗時顯示錯誤提示，且 modal 不關閉', async () => {
    vi.mocked(createFolder).mockResolvedValueOnce({
      ...testFolder,
      id: 'new-folder-id',
      images: []
    })
    vi.mocked(addItem).mockImplementationOnce(() => {
      throw new Error('save failed')
    })
    const { wrapper } = await mountPictureDetail('y2k-main-001', true, { attachTo: document.body })

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!

      await findBtn('ADD TO MOODBOARD').trigger('click')
      await findBtn('SAVE TO NEW FOLDER').trigger('click')
      await flushPromises()

      const input = document.querySelector('input') as HTMLInputElement
      input.value = 'My Folder'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const sendBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('SEND')
      ) as HTMLButtonElement
      sendBtn.click()
      await flushPromises()

      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
      expect(document.querySelector('input')).not.toBeNull()
    } finally {
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('重開 SAVE TO NEW FOLDER modal 後 input 不再 disabled', async () => {
    vi.useFakeTimers()
    const { wrapper } = await mountPictureDetail('y2k-main-001', true, { attachTo: document.body })

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!

      await findBtn('ADD TO MOODBOARD').trigger('click')
      await findBtn('SAVE TO NEW FOLDER').trigger('click')
      await flushPromises()

      const input = document.querySelector('input') as HTMLInputElement
      input.value = 'My Folder'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const sendBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('SEND')
      ) as HTMLButtonElement
      sendBtn.click()
      await flushPromises()
      vi.advanceTimersByTime(800)
      await flushPromises()

      await findBtn('ADD TO MOODBOARD').trigger('click')
      await findBtn('SAVE TO NEW FOLDER').trigger('click')
      await flushPromises()

      expect((document.querySelector('input') as HTMLInputElement).disabled).toBe(false)
    } finally {
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })
})
