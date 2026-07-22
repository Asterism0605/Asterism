<script setup lang="ts">
// src/components/feature/moodboard/
//   config.ts         — 常數與靜態資料
//   layout.ts         — 純幾何算法（packPhotos, ellipsePath...）
//   sphere.ts         — Three.js 球體邏輯
//   useOrbitDrag.ts   — 拖拉旋轉軌道 composable（手機/桌機共用）
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import DeleteFolderConfirm from '@/components/feature/moodboard/DeleteFolderConfirm.vue';
import DeleteIconButton from '@/components/feature/moodboard/DeleteIconButton.vue';
import DeleteImageConfirm from '@/components/feature/moodboard/DeleteImageConfirm.vue';
import FolderDirectory from '@/components/feature/moodboard/FolderDirectory.vue';
import ImageSelectToggle from '@/components/feature/moodboard/ImageSelectToggle.vue';
import MoodboardGlassButton from '@/components/feature/moodboard/MoodboardGlassButton.vue';
import FolderFilterPanel from '@/components/feature/moodboard/FolderFilterPanel.vue';
import FolderFilterPanelMobile from '@/components/feature/moodboard/FolderFilterPanelMobile.vue';
import MoodboardEmptyState from '@/components/feature/moodboard/MoodboardEmptyState.vue';
import MoodboardStatusDisplay from '@/components/feature/moodboard/MoodboardStatusDisplay.vue';
import TourTransition from '@/components/feature/guide/TourTransition.vue';
import { showToast } from '@/composables/useToast';
import {
  NAV_H,
  INNER_K,
  ORBIT_SPEED,
  MAX_FOLDERS,
  HO,
  MW,
  MH,
  M_HOME_ORBIT,
  M_DETAIL_ORBIT,
  photos,
  mDetailBase,
  buildMoodboardOrbitImages,
  buildPlaceholderOrbitImages,
  isFolderDimmed
} from '@/components/feature/moodboard/config';
import { packPhotos, ellipsePath, ellipsePathM } from '@/components/feature/moodboard/layout';
import type {
  MoodboardFolder,
  MoodboardMobilePhoto,
  MoodboardMobileSavedPhoto,
  MoodboardPositionedPhoto,
  MoodboardSavedPhoto,
  SavedImage
} from '@/types/moodboard';
import { initSphere } from '@/components/feature/moodboard/sphere';
import type { SphereHandle } from '@/components/feature/moodboard/sphere';
import { useOrbitDrag } from '@/components/feature/moodboard/useOrbitDrag';
import { useDeleteMoodboardImage } from '@/composables/useDeleteMoodboardImage';
import { useMoodboardInteractionState } from '@/composables/useMoodboardInteractionState';
import { useFolderImageFilters } from '@/composables/useFolderImageFilters';
import { deleteFolder } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePageUserTour } from '@/composables/guide/usePageUserTour';
import { useMoodboardTourFlow } from '@/composables/guide/useMoodboardTourFlow';

const props = defineProps({
  height: { type: String, default: '100vh' },
  folders: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  basePath: { type: String, default: '/moodboard' }
});
const emit = defineEmits(['open', 'home']);

const DIMMED_OPACITY = 0.7;
const ORBIT_SNAP_ANGLE_DESKTOP = -Math.PI / 2 - Math.PI / 3;
const ORBIT_SNAP_ANGLE_MOBILE = -Math.PI / 2;
const ORBIT_SNAP_HOLD_MS = 2000;

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const moodboardStore = useMoodboardStore();
const authStore = useAuthStore();
const coreTour = usePageUserTour(computed(() => authStore.user?.id));

const activeSphereFolderId = ref<string | null>(null);
const previewingEmptyFolderId = ref<string | null>(null);
const folderNames = computed(() => moodboardStore.folders.map((folder) => folder.name));
const sphereFolder = computed(() => {
  const activeFolder = moodboardStore.folders.find(
    (folder) => folder.id === activeSphereFolderId.value && folder.images.length > 0
  );
  if (activeFolder) return activeFolder;

  return moodboardStore.folders.reduce<MoodboardFolder | undefined>((newest, folder) => {
    if (folder.images.length === 0) return newest;
    return !newest || folder.createdAt > newest.createdAt ? folder : newest;
  }, undefined);
});
const orbitImages = computed(() =>
  previewingEmptyFolderId.value
    ? buildPlaceholderOrbitImages()
    : buildMoodboardOrbitImages(sphereFolder.value?.images ?? [])
);
const highlightedFolderId = computed(
  () => previewingEmptyFolderId.value ?? sphereFolder.value?.id ?? null
);

/* ---- reactive state ---- */
const scale = ref(1);
const hasFolders = ref(true);
const orbitPhase = ref(0);
const hoverIdx = ref(-1);
const orbitHoldFolderIndex = ref<number | null>(null);
let orbitHoldTimer: ReturnType<typeof setTimeout> | null = null;
// 只在 armOrOpenMobileFolder 內由實際點擊寫入，hover/pointerenter 一律不得碰它，
// 否則手機上同一次點擊裡 pointerenter 先跑一次 preview 會讓 click 誤判成「已經點過一次」。
const mobileArmedFolderId = ref<string | null>(null);
const selectedFolder = ref(0);
const selectedName = computed(() => getFolderName(selectedFolder.value));
const scatter = ref<MoodboardPositionedPhoto[]>([]);
const sphereCanvas = ref<HTMLCanvasElement | null>(null);
const isMobile = ref(false);
const deskVisibleH = ref(1024);
const deskBackTop = computed(() => Math.round(deskVisibleH.value - 130));
const deskTabTop = computed(() => Math.round(deskVisibleH.value - 96));
const mStage = ref<HTMLElement | null>(null);
const deskStage = ref<HTMLElement | null>(null);
const mDesignH = ref(MH);
const mDetailPhotos = ref<MoodboardMobileSavedPhoto[]>([]);
const mHomePhotosRandom = ref<MoodboardMobilePhoto[]>([]);
const deleteTarget = ref<{ id: string; name: string } | null>(null);
const isDeleteModalOpen = ref(false);
const isDeletingFolder = ref(false);

const { isOrbitActive: isMoodboardOrbitTourActive } = useMoodboardTourFlow({
  coreTour,
  folders: computed(() => moodboardStore.folders),
  status: computed(() => moodboardStore.status),
  isEmpty: computed(() => moodboardStore.isEmpty),
  hasFolders,
  previewFolder,
  goHome
});

const folderFilters = useFolderImageFilters(
  () => moodboardStore.folders[selectedFolder.value]?.images ?? []
);

function getSelectableImageIds(): string[] {
  // 有套用篩選時，「全選」只包含目前顯示的圖片，避免刪除使用者看不到的項目；
  // 未篩選時才以整個資料夾作為全選範圍。
  const images = folderFilters.hasActiveFilters.value
    ? folderFilters.displayedImages.value
    : (moodboardStore.folders[selectedFolder.value]?.images ?? []);

  return images.map((image) => image.itemId);
}

const {
  isFolderDeleteMode,
  isImageSelectMode,
  selectedImageIds,
  toggleFolderDeleteMode,
  toggleImageSelectMode,
  toggleImageSelection,
  isAllImagesSelected,
  toggleSelectAllImages,
  resetImageSelection,
  resetInteractionState
} = useMoodboardInteractionState(getSelectableImageIds);

const { isDeleteImageModalOpen, isDeletingImage, requestDeleteImage, confirmDeleteImage } =
  useDeleteMoodboardImage({
    getFolder: () => moodboardStore.folders[selectedFolder.value],
    onDeleted: (itemIds) => {
      scatter.value = scatter.value.filter((n) => !itemIds.includes(n.itemId));
      mDetailPhotos.value = mDetailPhotos.value.filter((p) => !itemIds.includes(p.itemId));
      resetImageSelection();
    }
  });

function confirmSelectedImagesDone() {
  if (selectedImageIds.value.size === 0) {
    toggleImageSelectMode();
    return;
  }
  requestDeleteImage(Array.from(selectedImageIds.value));
}
// 拖拉旋轉手機/桌機共用同一顆 orbitPhase；差異只在舞台元素與軌道中心，依 isMobile 切換幾何。
const { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag } = useOrbitDrag(
  () => (isMobile.value ? mStage.value : deskStage.value),
  scale,
  orbitPhase,
  hasFolders,
  () => (isMobile.value ? M_HOME_ORBIT : HO),
  (point) =>
    isMoodboardOrbitTourActive.value ||
    (isMobile.value ? nearMobileFolder(point) : nearDeskFolder(point))
);
/* ---- derived ---- */
const stageStyle = computed<CSSProperties>(() => ({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '1440px',
  height: '1024px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}));

const sphereStyle = computed<CSSProperties>(() => {
  const vh = deskVisibleH.value;
  const size = Math.min(860, Math.max(440, vh - 70));
  const top = Math.max(36, (vh - size) / 2 + 50);
  const left = Math.round(1000 - size / 2);
  return {
    position: 'absolute',
    left: left + 'px',
    top: Math.round(top) + 'px',
    width: size + 'px',
    height: size + 'px',
    pointerEvents: 'auto',
    cursor: 'pointer'
  };
});

const mStageStyle = computed<CSSProperties>(() => ({
  position: 'absolute',
  left: '0',
  top: '0',
  width: MW + 'px',
  height: mDesignH.value + 'px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}));

const mOrbitOuter = computed(() =>
  ellipsePathM(hasFolders.value ? M_HOME_ORBIT : M_DETAIL_ORBIT, 1)
);
const mOrbitInner = computed(() =>
  ellipsePathM(hasFolders.value ? M_HOME_ORBIT : M_DETAIL_ORBIT, 0.9)
);

const mFolders = computed(() => {
  const o = M_HOME_ORBIT,
    n = MAX_FOLDERS,
    w = 86,
    h = 66;
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + orbitPhase.value;
    const folder = moodboardStore.folders[i];
    return {
      i,
      cx: o.cx + o.rx * Math.cos(ang),
      cy: o.cy + o.ry * Math.sin(ang),
      w,
      h,
      active: !!folder && folder.id === highlightedFolderId.value,
      dimmed: isFolderDimmed(folder),
      hasFolder: !!folder
    };
  });
});

const mPhotoView = computed(() => {
  if (hasFolders.value) return mHomePhotosRandom.value;
  return mDetailPhotos.value;
});

const outerPath = computed(() => ellipsePath(1));
const innerPath = computed(() => ellipsePath(INNER_K));

const folderView = computed(() => {
  const n = MAX_FOLDERS,
    w = 100,
    h = 50;
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + orbitPhase.value;
    const cx = HO.cx + HO.rx * Math.cos(ang);
    const cy = HO.cy + HO.ry * Math.sin(ang);
    const deg = ((((ang * 180) / Math.PI) % 360) + 360) % 360;
    const onLine = deg >= 105 && deg <= 350;
    const folder = moodboardStore.folders[i];
    return {
      i,
      w,
      h,
      active: hoverIdx.value === i,
      onLine,
      dimmed: isFolderDimmed(folder),
      hasFolder: !!folder,
      left: cx - w / 2 - 10,
      top: cy - h / 2 - 30
    };
  });
});

function nearMobileFolder(point: { x: number; y: number }): boolean {
  const margin = 18;
  return mFolders.value.some(
    (folder) =>
      Math.abs(point.x - folder.cx) <= folder.w / 2 + margin &&
      Math.abs(point.y - folder.cy) <= folder.h / 2 + margin
  );
}

function nearDeskFolder(point: { x: number; y: number }): boolean {
  const margin = 18;
  return folderView.value.some((folder) => {
    if (!folder.onLine) return false;
    const width = folder.w + 20;
    const height = folder.h + 30;
    const centerX = folder.left + width / 2;
    const centerY = folder.top + height / 2;
    return (
      Math.abs(point.x - centerX) <= width / 2 + margin &&
      Math.abs(point.y - centerY) <= height / 2 + margin
    );
  });
}

const showEmpty = computed(() => moodboardStore.status === 'idle' || moodboardStore.isEmpty);

function exploreStyleDna(): void {
  coreTour.complete();
  void router.push({ name: 'style-dna' });
}

function stayInMoodboard(): void {
  coreTour.complete();
}

function finishOrbitDrag(event: PointerEvent): void {
  const didDrag = onDragEnd(event);
  if (
    didDrag &&
    coreTour.state.value.status === 'active' &&
    coreTour.state.value.step === 'moodboard-orbit'
  ) {
    coreTour.advance('moodboard-folder');
  }
}

function getFolderName(index: number): string {
  return folderNames.value[index] ?? '';
}

function hoverFolder(index: number) {
  const folder = moodboardStore.folders[index];
  if (!folder?.images.length) return;

  hoverIdx.value = index;
  activeSphereFolderId.value = folder.id;
  previewingEmptyFolderId.value = null;
}

function snapOrbitToFolder(index: number) {
  const targetAngle = isMobile.value ? ORBIT_SNAP_ANGLE_MOBILE : ORBIT_SNAP_ANGLE_DESKTOP;
  orbitPhase.value = targetAngle - (index / MAX_FOLDERS) * Math.PI * 2 + Math.PI / 2;

  if (!isMobile.value) return;

  orbitHoldFolderIndex.value = index;
  if (orbitHoldTimer) clearTimeout(orbitHoldTimer);
  orbitHoldTimer = setTimeout(() => {
    orbitHoldFolderIndex.value = null;
    orbitHoldTimer = null;
  }, ORBIT_SNAP_HOLD_MS);
}

function previewFolder(index: number) {
  const folder = moodboardStore.folders[index];
  if (!folder) return;

  snapOrbitToFolder(index);

  if (!folder.images.length) {
    hoverIdx.value = index;
    previewingEmptyFolderId.value = folder.id;
    return;
  }
  hoverFolder(index);
}

function previewFolderById(folderId: string) {
  if (dragging.value) return;
  const index = moodboardStore.folders.findIndex((folder) => folder.id === folderId);
  if (index !== -1) previewFolder(index);
}

function leaveFolder() {
  hoverIdx.value = -1;
}

function onFolderMouseEnter(index: number) {
  if (dragging.value) return;

  const folder = moodboardStore.folders[index];
  if (!folder) return;

  // 軌道圖示本身只切換預覽；若在 hover 時重新指定 orbitPhase，圖示會從游標下
  // 瞬間跳到定位點，並在拖曳時和 pointermove 互相搶控制權。
  if (!folder.images.length) {
    hoverIdx.value = index;
    previewingEmptyFolderId.value = folder.id;
    return;
  }
  hoverFolder(index);
}

function onFolderMouseLeave() {
  leaveFolder();
}

function requestDeleteFolder(index: number) {
  const folder = moodboardStore.folders[index];
  if (!folder) return;

  deleteTarget.value = { id: folder.id, name: folder.name };
  isDeleteModalOpen.value = true;
}

async function confirmDeleteFolder() {
  const profileId = authStore.user?.id;
  if (!deleteTarget.value || isDeletingFolder.value || !profileId) return;

  isDeletingFolder.value = true;
  try {
    await deleteFolder(deleteTarget.value.id, profileId);
    moodboardStore.removeFolder(deleteTarget.value.id);
    isDeleteModalOpen.value = false;
    deleteTarget.value = null;
    hoverIdx.value = -1;
    mHover.value = -1;
  } catch {
    showToast({ type: 'error', message: t('toast.deleteFolderFailed') });
  } finally {
    isDeletingFolder.value = false;
  }
}

function toPhotos(images: SavedImage[], mobile = false): MoodboardSavedPhoto[] {
  const sizes = mobile ? mDetailBase : photos;

  return images.map((image, index) => ({
    src: image.src,
    itemId: image.itemId,
    w: sizes[index % sizes.length].w,
    h: sizes[index % sizes.length].h,
    imageId: image.id
  }));
}

function goToImage(imageId: string) {
  const slug = route.params.slug;
  const moodboardSlug = typeof slug === 'string' ? slug : undefined;

  router.push({
    name: 'picture-detail',
    params: { imageId },
    query: moodboardSlug ? { moodboardSlug } : undefined
  });
}

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
  const ph = img.nextElementSibling as HTMLElement | null;
  if (ph) ph.style.display = 'block';
}

function buildDetail() {
  const o = HO;
  const floor = deskVisibleH.value;
  const list = toPhotos(folderFilters.displayedImages.value);
  const nodes = packPhotos(list, {
    idPrefix: 's',
    cx: o.cx,
    cy: o.cy,
    rx: o.rx,
    ry: o.ry,
    gap: 14,
    xMin: 18,
    xMax: 1422,
    yMin: 234,
    yMax: floor - 116,
    obstacles: [
      { x0: -100, x1: 412, y0: -100, y1: 300 },
      { x0: -100, x1: 360, y0: floor - 100, y1: floor + 100 }
    ]
  });
  scatter.value = nodes.map((d) => ({
    id: d.id,
    itemId: d.itemId,
    src: d.src,
    w: d.w,
    h: d.h,
    delay: d.delay,
    x: d.x,
    y: d.y,
    imageId: d.imageId
  }));
}

function buildMobileDetail() {
  const o = M_DETAIL_ORBIT;
  const photoFloorBottom = mDesignH.value - 138;
  const list = toPhotos(folderFilters.displayedImages.value, true);
  const nodes = packPhotos(list, {
    idPrefix: 'md',
    cx: o.cx,
    cy: o.cy,
    rx: o.rx,
    ry: o.ry,
    gap: 10,
    xMin: 16,
    xMax: 424,
    yMin: 250,
    yMax: photoFloorBottom
  });
  mDetailPhotos.value = nodes.map((d) => ({
    id: d.id,
    itemId: d.itemId,
    src: d.src,
    w: d.w,
    h: d.h,
    faded: d.faded,
    delay: d.delay,
    cx: d.x,
    cy: d.y,
    imageId: d.imageId
  }));
}

function buildMobileHome() {
  const o = M_HOME_ORBIT;
  const list = orbitImages.value.map((image, index) => {
    const size = mDetailBase[index % mDetailBase.length];
    return {
      src: image.src,
      w: size.w,
      h: size.h,
      faded: image.isPlaceholder,
      placeholder: image.isPlaceholder
    };
  });
  const nodes = packPhotos(list, {
    idPrefix: 'mh',
    cx: o.cx,
    cy: o.cy,
    rx: o.rx,
    ry: o.ry,
    gap: 12,
    xMin: 16,
    xMax: 424,
    yMin: 330,
    yMax: 720
  });
  mHomePhotosRandom.value = nodes.map((d) => ({
    id: d.id,
    src: d.src,
    w: d.w,
    h: d.h,
    faded: d.faded,
    placeholder: d.placeholder,
    delay: d.delay,
    cx: d.x,
    cy: d.y
  }));
}

function openFolder(i: number) {
  if (isMoodboardOrbitTourActive.value) return;
  if (!moodboardStore.folders[i]?.images.length) return;

  selectedFolder.value = i;
  hasFolders.value = false;
  resetInteractionState();
  handleResetFilters();
  navigate(slugFor(i), i);
  if (
    coreTour.state.value.status === 'active' &&
    coreTour.state.value.step === 'moodboard-folder'
  ) {
    coreTour.advance('moodboard-filters');
  }
}

function handleToggleStyle(styleGroup: string) {
  folderFilters.toggleStyleGroup(styleGroup);
  if (isMobile.value) buildMobileDetail();
  else buildDetail();
}

function handleToggleMedium(medium: string) {
  folderFilters.toggleMedium(medium);
  if (isMobile.value) buildMobileDetail();
  else buildDetail();
}

function handleResetFilters() {
  folderFilters.reset();
  if (isMobile.value) buildMobileDetail();
  else buildDetail();
}

function slugFor(i: number) {
  const name = getFolderName(i) || 'folder-' + i;
  return encodeURIComponent(name.trim().replace(/\s+/g, '-').toLowerCase());
}

function findFolderIndexBySlug(slug: string): number {
  return moodboardStore.folders.findIndex(
    (_, index) => decodeURIComponent(slugFor(index)) === slug
  );
}

function navigate(slug: string, i: number) {
  const path = props.basePath + (slug ? '/' + slug : '');
  router.push(path);
  if (slug) emit('open', { index: i, name: getFolderName(i), slug, path });
  else emit('home', { path });
}

function goHome() {
  hasFolders.value = true;
  resetInteractionState();
  hoverIdx.value = -1;
  mHover.value = -1;
  dragging.value = false;
  activeSphereFolderId.value = null;
  previewingEmptyFolderId.value = null;
  // 回首頁後預覽會 fallback 回預設資料夾，armed 狀態要跟著同步，
  // 這樣使用者再點一次預設資料夾時，才會維持「已在預覽中，點一次就開」的行為。
  mobileArmedFolderId.value = highlightedFolderId.value;
  navigate('', -1);
}

watch(
  () => route.params.slug,
  (slug) => {
    if (!slug && !hasFolders.value) {
      hasFolders.value = true;
      resetImageSelection();
      hoverIdx.value = -1;
      mHover.value = -1;
    }
  }
);

function onFolderClick(i: number) {
  if (consumeDidDrag()) return;
  if (isFolderDeleteMode.value) {
    requestDeleteFolder(i);
    return;
  }
  openFolder(i);
}

function openFolderById(folderId: string) {
  const index = moodboardStore.folders.findIndex((folder) => folder.id === folderId);
  if (index === -1) return;

  if (isFolderDeleteMode.value) {
    requestDeleteFolder(index);
    return;
  }

  openFolder(index);
}

function armOrOpenMobileFolder(index: number) {
  if (consumeDidDrag()) return;

  const folder = moodboardStore.folders[index];
  if (!folder) return;

  if (isFolderDeleteMode.value) {
    requestDeleteFolder(index);
    return;
  }

  if (mobileArmedFolderId.value === folder.id) {
    openFolder(index);
    return;
  }

  mobileArmedFolderId.value = folder.id;
  previewFolder(index);
}

function armOrOpenMobileFolderById(folderId: string) {
  const index = moodboardStore.folders.findIndex((folder) => folder.id === folderId);
  if (index !== -1) armOrOpenMobileFolder(index);
}

function onSphereClick() {
  if (consumeDidDrag()) return;
  if (isFolderDeleteMode.value) return;

  const folder = sphereFolder.value;
  if (!folder) return;

  const index = moodboardStore.folders.findIndex((candidate) => candidate.id === folder.id);
  if (index === -1) return;

  openFolder(index);
}

let sphereHandle: SphereHandle | null = null;
let orbitRaf = 0;
let orbitLast: number | null = null;

function orbitLoop(ts: number) {
  if (orbitLast === null) orbitLast = ts;
  const dt = Math.min(0.05, (ts - orbitLast) / 1000);
  orbitLast = ts;
  const tourPause =
    coreTour.state.value.status === 'active' && coreTour.state.value.step === 'moodboard-folder';
  const previewPause =
    tourPause || orbitHoldFolderIndex.value !== null || (!isMobile.value && hoverIdx.value >= 0);
  if (hasFolders.value && !dragging.value && !previewPause) orbitPhase.value += ORBIT_SPEED * dt;
  orbitRaf = requestAnimationFrame(orbitLoop);
}

function onResize() {
  isMobile.value = window.innerWidth < 760;
  const viewH = window.innerHeight - NAV_H;
  if (isMobile.value) {
    scale.value = window.innerWidth / MW;
    mDesignH.value = Math.max(MH * 0.72, viewH / scale.value);
  } else {
    scale.value = window.innerWidth / 1440;
    deskVisibleH.value = Math.min(1024, viewH / scale.value);
    nextTick(() => sphereHandle && sphereHandle.resize());
  }
  if (!hasFolders.value) {
    if (isMobile.value) buildMobileDetail();
    else buildDetail();
  }
}

async function retryMoodboard() {
  const profileId = authStore.user?.id;

  if (!profileId) {
    return;
  }

  await moodboardStore.fetchMoodboard(profileId);
  if (moodboardStore.status === 'success') {
    if (isMobile.value) buildMobileHome();
    initializeSphere();
  }
}

function initializeSphere() {
  if (orbitImages.value.length === 0) {
    sphereHandle?.dispose();
    sphereHandle = null;
    return;
  }

  if (!sphereCanvas.value) {
    return;
  }

  if (sphereHandle) {
    sphereHandle.updateImages(orbitImages.value);
    return;
  }

  sphereHandle = initSphere(
    sphereCanvas.value,
    () => scale.value,
    () => hasFolders.value,
    orbitImages.value,
    onSphereClick
  );
}

watch(orbitImages, () => {
  nextTick(initializeSphere);
  if (isMobile.value && hasFolders.value) {
    buildMobileHome();
  }
});

onMounted(async () => {
  onResize();
  window.addEventListener('resize', onResize);
  const profileId = authStore.user?.id;
  if (
    profileId &&
    (moodboardStore.status === 'idle' || moodboardStore.loadedProfileId !== profileId)
  ) {
    await moodboardStore.fetchMoodboard(profileId);
  }

  // 資料載入完成後，預設高亮的資料夾本來就等同「已在預覽中」，
  // 手機版第一次點它要能直接開啟，而不是被當成完全沒點過。
  mobileArmedFolderId.value = highlightedFolderId.value;

  const initialSlug = typeof route.params.slug === 'string' ? route.params.slug : undefined;
  if (initialSlug) {
    const index = findFolderIndexBySlug(initialSlug);
    if (index !== -1) {
      selectedFolder.value = index;
      hasFolders.value = false;
    }
  }

  if (isMobile.value) {
    if (hasFolders.value) buildMobileHome();
    else buildMobileDetail();
  } else if (!hasFolders.value) {
    buildDetail();
  }
  nextTick(initializeSphere);
  orbitRaf = requestAnimationFrame(orbitLoop);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(orbitRaf);
  if (orbitHoldTimer) clearTimeout(orbitHoldTimer);
  sphereHandle?.dispose();
  sphereHandle = null;
});
</script>

<template>
  <div
    class="relative w-full overflow-hidden"
    :style="{ background: '#0b0b0d', height: `calc(100vh - ${NAV_H}px)`, marginTop: `${NAV_H}px` }"
  >
    <MoodboardStatusDisplay
      v-if="moodboardStore.status === 'loading' || moodboardStore.status === 'error'"
      :status="moodboardStore.status"
      @retry="retryMoodboard"
    />
    <MoodboardEmptyState v-else-if="showEmpty" />
    <template v-else>
      <!-- ===================== MOBILE STAGE (440×fluid) ===================== -->
      <div
        v-if="isMobile"
        ref="mStage"
        class="relative"
        :style="mStageStyle"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="finishOrbitDrag"
        @pointercancel="finishOrbitDrag"
        @pointerleave="finishOrbitDrag"
        @dragstart.prevent
      >
        <!-- orbit line stays the SAME on detail — only the folders disappear -->
        <svg
          class="absolute inset-0 pointer-events-none"
          :width="MW"
          :height="mDesignH"
          :viewBox="`0 0 ${MW} ${mDesignH}`"
          fill="none"
        >
          <path :d="mOrbitOuter" stroke="rgba(220,222,228,0.42)" stroke-width="1" fill="none" />
          <path :d="mOrbitInner" stroke="rgba(220,222,228,0.28)" stroke-width="1" fill="none" />
        </svg>

        <!-- HOME: folders revolve along the orbit (up to 10). Drag to rotate, tap to open. -->
        <div
          v-show="hasFolders"
          data-tour="moodboard-orbit"
          class="absolute inset-0"
          :style="{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }"
        >
          <div
            v-for="f in mFolders"
            :key="'mf' + f.i"
            :data-testid="`moodboard-folder-mobile-${f.i}`"
            :data-tour="f.hasFolder && !f.dimmed ? 'moodboard-orbit-folder' : undefined"
            class="absolute"
            :style="{
              left: f.cx - f.w / 2 + 'px',
              top: f.cy - f.h / 2 + 'px',
              width: f.w + 'px',
              height: f.h + 'px',
              transform: f.active ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform .22s ease',
              zIndex: f.active ? 20 : 5,
              cursor: f.hasFolder ? 'pointer' : 'default',
              pointerEvents: f.hasFolder ? 'auto' : 'none'
            }"
            @click="armOrOpenMobileFolder(f.i)"
          >
            <img
              :src="f.active ? '/images/folder-active.png' : '/images/folder-idle.png'"
              draggable="false"
              class="w-full h-full select-none"
              :style="{
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
                filter: f.dimmed
                  ? 'drop-shadow(0 10px 22px rgba(0, 0, 0, 0.5)) grayscale(1)'
                  : 'drop-shadow(0 10px 22px rgba(0, 0, 0, 0.5))',
                opacity: f.dimmed ? DIMMED_OPACITY : 1
              }"
            />
            <DeleteIconButton
              v-if="f.hasFolder && isFolderDeleteMode"
              :data-testid="`folder-delete-mobile-${f.i}`"
              :size="28"
              :icon-size="20"
              :style="{
                position: 'absolute',
                top: '-10px',
                right: '-15px',
                zIndex: 40
              }"
              @delete="requestDeleteFolder(f.i)"
            />
          </div>
        </div>

        <div
          v-if="previewingEmptyFolderId"
          class="absolute flex items-center justify-center"
          style="left: 16px; top: 330px; width: 408px; height: 390px; pointer-events: none; z-index: 35"
        >
          <RouterLink
            data-testid="moodboard-empty-folder-preview-cta-mobile"
            to="/"
            class="pointer-events-auto inline-flex rounded-full bg-cta px-7 py-3 font-semibold text-white transition hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {{ $t('moodboard.startExploring') }}
          </RouterLink>
        </div>

        <!-- photos (peek on home, randomised + fade-in on detail) -->
        <!-- outer = entrance fade/slide (staggered); inner = idle float -->
        <div
          v-for="(p, photoIndex) in mPhotoView"
          :key="p.id"
          :data-tour="hasFolders && photoIndex === 0 ? 'moodboard-images' : undefined"
          class="absolute photo-enter"
          :style="{
            left: p.cx - p.w / 2 + 'px',
            top: p.cy - p.h / 2 + 'px',
            width: p.w + 'px',
            height: p.h + 'px',
            animationDelay: p.delay + 's'
          }"
        >
          <div
            class="image-card w-full h-full"
            :class="{
              'photo-placeholder': p.placeholder,
              'photo-faded': !p.placeholder && p.faded
            }"
            :style="{ animationDelay: p.delay + 's' }"
          >
            <button
              type="button"
              class="moodboard-photo-link"
              data-testid="moodboard-mobile-photo"
              :disabled="
                hasFolders ? !sphereFolder || p.placeholder : !isImageSelectMode && !p.imageId
              "
              :aria-label="
                hasFolders ? $t('moodboard.openFolderAria') : $t('moodboard.openImageDetailAria')
              "
              @click="
                hasFolders
                  ? onSphereClick()
                  : isImageSelectMode
                    ? p.itemId && toggleImageSelection(p.itemId)
                    : p.imageId && goToImage(p.imageId)
              "
            >
              <img
                :src="p.src"
                draggable="false"
                alt=""
                class="w-full h-full block select-none"
                style="object-fit: cover; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55)"
                @error="onImgError"
              />
              <div
                class="w-full h-full"
                style="
                  display: none;
                  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
                  background:
                    repeating-linear-gradient(
                      45deg,
                      rgba(255, 255, 255, 0.05) 0 9px,
                      rgba(255, 255, 255, 0.09) 9px 18px
                    ),
                    #26272b;
                "
              ></div>
            </button>
            <!-- eslint-disable vue/attribute-hyphenation -->
            <ImageSelectToggle
              v-if="isImageSelectMode && p.itemId"
              :data-testid="`image-select-${p.itemId}`"
              :selected="selectedImageIds.has(p.itemId)"
              :ariaLabel="
                selectedImageIds.has(p.itemId)
                  ? $t('moodboard.deselectImageAria')
                  : $t('moodboard.selectImageAria')
              "
              :style="{ position: 'absolute', top: '-12px', right: '-12px', zIndex: 40 }"
              @toggle="toggleImageSelection(p.itemId)"
            />
            <!-- eslint-enable vue/attribute-hyphenation -->
          </div>
        </div>

        <div
          v-if="hasFolders && moodboardStore.folders.length > 0"
          class="absolute"
          style="left: 8px; top: 20px; right: 20px"
        >
          <FolderDirectory
            :folders="moodboardStore.folders"
            :active-folder-id="highlightedFolderId"
            :focus-preview="false"
            @preview="previewFolderById"
            @preview-end="leaveFolder"
            @open="armOrOpenMobileFolderById"
          />
        </div>

        <!-- detail: back (just above the name tab) + docked folder-name tab -->
        <div
          v-show="!hasFolders"
          class="absolute inset-0 pointer-events-none"
          data-tour="moodboard-filters"
        >
          <FolderFilterPanelMobile
            :style-options="folderFilters.availableStyleGroups.value"
            :medium-options="folderFilters.availableMediums.value"
            :selected-style-groups="folderFilters.selectedStyleGroups.value"
            :selected-mediums="folderFilters.selectedMediums.value"
            :has-active-filters="folderFilters.hasActiveFilters.value"
            @toggle-style="handleToggleStyle"
            @toggle-medium="handleToggleMedium"
            @reset="handleResetFilters"
          />
          <button
            class="absolute flex items-center gap-2 text-white/80"
            style="
              left: 22px;
              bottom: 132px;
              font-size: 16px;
              font-weight: 300;
              background: none;
              border: none;
              cursor: pointer;
              pointer-events: auto;
            "
            @click="goHome"
          >
            <span style="font-size: 19px; line-height: 1">&larr;</span> {{ $t('moodboard.back') }}
          </button>
          <div
            class="absolute"
            style="left: 0; right: 0; bottom: 14px; height: 92px; pointer-events: auto"
          >
            <div
              class="absolute"
              style="
                left: 14px;
                top: -14px;
                width: 120px;
                height: 30px;
                border-radius: 16px 16px 0 0;
                background: linear-gradient(180deg, rgba(42, 43, 48, 0.62), rgba(26, 27, 31, 0.55));
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-bottom: none;
              "
            ></div>
            <div
              class="absolute"
              style="
                left: 8px;
                right: 8px;
                top: 0;
                bottom: 0;
                border-radius: 26px;
                background: linear-gradient(180deg, rgba(54, 55, 61, 0.62), rgba(24, 25, 29, 0.58));
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 -14px 50px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <span
                class="text-white/90"
                style="font-size: 24px; font-weight: 400; letter-spacing: 0.5px"
                >{{ selectedName }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== DESKTOP STAGE (1440×1024) ===================== -->
      <div
        v-else
        ref="deskStage"
        data-testid="moodboard-stage-desktop"
        class="relative"
        :style="stageStyle"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="finishOrbitDrag"
        @pointercancel="finishOrbitDrag"
        @pointerleave="finishOrbitDrag"
        @dragstart.prevent
      >
        <!-- ===== ORBIT LINES (same arc on both pages) ===== -->
        <svg
          class="absolute inset-0 pointer-events-none"
          width="1440"
          height="1024"
          viewBox="0 0 1440 1024"
          fill="none"
        >
          <path :d="outerPath" stroke="rgba(220,222,228,0.45)" stroke-width="1" fill="none" />
          <path :d="innerPath" stroke="rgba(220,222,228,0.32)" stroke-width="1" fill="none" />
        </svg>

        <i
          v-if="hasFolders"
          class="moodboard-corner-orbit moodboard-corner-orbit--one"
          aria-hidden="true"
        ></i>
        <i
          v-if="hasFolders"
          class="moodboard-corner-orbit moodboard-corner-orbit--two"
          aria-hidden="true"
        ></i>
        <i
          v-if="hasFolders && moodboardStore.folders.length > 0"
          class="folder-directory-spine"
          aria-hidden="true"
        ></i>

        <!-- ===== STATE A : HAS FOLDERS (orbit + photo sphere) ===== -->
        <div
          v-show="hasFolders"
          data-tour="moodboard-orbit"
          class="absolute inset-0"
          :style="{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }"
        >
          <div class="absolute" :style="sphereStyle">
            <canvas ref="sphereCanvas" class="absolute inset-0 h-full w-full"></canvas>
            <div
              data-tour="moodboard-images"
              class="pointer-events-none absolute"
              style="left: 25%; top: 25%; width: 50%; height: 50%"
            ></div>
          </div>

          <div
            v-if="previewingEmptyFolderId"
            class="absolute flex items-center justify-center"
            :style="{ ...sphereStyle, pointerEvents: 'none', zIndex: 35 }"
          >
            <RouterLink
              data-testid="moodboard-empty-folder-preview-cta"
              to="/"
              class="pointer-events-auto inline-flex rounded-full bg-cta px-7 py-3 font-semibold text-white transition hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {{ $t('moodboard.startExploring') }}
            </RouterLink>
          </div>

          <!-- folder images orbit the ellipse; hovering swaps to the active image + pauses the orbit -->
          <div
            v-for="fv in folderView"
            :key="'f' + fv.i"
            :data-testid="`moodboard-folder-${fv.i}`"
            :data-tour="fv.hasFolder && !fv.dimmed ? 'moodboard-orbit-folder' : undefined"
            class="absolute"
            :style="{
              left: fv.left + 'px',
              top: fv.top + 'px',
              width: fv.w + 20 + 'px',
              height: fv.h + 30 + 'px',
              transform: fv.active ? 'scale(1.07)' : 'scale(1)',
              transformOrigin: 'center center',
              transition: 'transform .28s ease, opacity .35s ease',
              opacity: fv.onLine ? (fv.dimmed ? DIMMED_OPACITY : 1) : 0,
              pointerEvents: fv.onLine && fv.hasFolder ? 'auto' : 'none',
              zIndex: fv.active ? 30 : 2,
              cursor: fv.hasFolder ? (dragging ? 'grabbing' : 'grab') : 'default'
            }"
            @mouseenter="onFolderMouseEnter(fv.i)"
            @mouseleave="onFolderMouseLeave"
            @click="onFolderClick(fv.i)"
          >
            <img
              :src="fv.active ? '/images/folder-active.png' : '/images/folder-idle.png'"
              draggable="false"
              class="w-full h-full select-none"
              :style="{
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
                filter: fv.dimmed ? 'grayscale(1)' : 'none'
              }"
            />
            <DeleteIconButton
              v-if="fv.hasFolder && isFolderDeleteMode"
              :data-testid="`folder-delete-${fv.i}`"
              :size="28"
              :icon-size="20"
              :style="{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                zIndex: 40
              }"
              @delete="requestDeleteFolder(fv.i)"
            />
          </div>
        </div>

        <!-- ===== DETAIL PAGE : opened folder — photos randomly arranged (static, non-overlapping) inside the visible circle ===== -->
        <div
          v-show="!hasFolders"
          class="absolute inset-0"
          data-tour="moodboard-filters"
        >
          <div
            v-for="n in scatter"
            :key="n.id"
            :data-testid="n.itemId ? `moodboard-image-${n.itemId}` : undefined"
            class="absolute image-card"
            :style="{
              left: n.x - n.w / 2 + 'px',
              top: n.y - n.h / 2 + 'px',
              width: n.w + 'px',
              height: n.h + 'px',
              animationDelay: n.delay + 's'
            }"
          >
            <button
              type="button"
              class="moodboard-photo-link"
              data-testid="moodboard-detail-photo"
              :disabled="!isImageSelectMode && !n.imageId"
              :aria-label="$t('moodboard.openImageDetailAria')"
              @click="isImageSelectMode ? toggleImageSelection(n.itemId) : n.imageId && goToImage(n.imageId)"
            >
              <img
                :src="n.src"
                draggable="false"
                alt=""
                class="moodboard-photo-img w-full h-full block select-none"
                style="object-fit: cover; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55)"
                @error="onImgError"
              />
              <div
                class="moodboard-photo-img w-full h-full"
                style="
                  display: none;
                  border: 2px solid rgba(244, 244, 240, 0.9);
                  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
                  background:
                    repeating-linear-gradient(
                      45deg,
                      rgba(255, 255, 255, 0.05) 0 10px,
                      rgba(255, 255, 255, 0.09) 10px 20px
                    ),
                    #2b2c30;
                "
              ></div>
            </button>
            <!-- eslint-disable vue/attribute-hyphenation -->
            <ImageSelectToggle
              v-if="isImageSelectMode"
              :data-testid="`image-select-${n.itemId}`"
              :selected="selectedImageIds.has(n.itemId)"
              :ariaLabel="
                selectedImageIds.has(n.itemId)
                  ? $t('moodboard.deselectImageAria')
                  : $t('moodboard.selectImageAria')
              "
              :style="{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                zIndex: 40
              }"
              @toggle="toggleImageSelection(n.itemId)"
            />
            <!-- eslint-enable vue/attribute-hyphenation -->
          </div>

          <!-- back link (sits just above the docked tab, against the visible bottom) -->
          <div class="absolute" :style="{ left: '30px', top: deskBackTop + 'px' }">
            <button
              class="flex items-center gap-2 text-white/75 hover:text-white"
              style="
                font-size: 17px;
                background: none;
                border: none;
                cursor: pointer;
                font-weight: 300;
              "
              @click="goHome"
            >
              <span style="font-size: 20px; line-height: 1">&larr;</span> {{ $t('moodboard.back') }}
            </button>
          </div>
          <!-- docked folder-name tab -->
          <div
            class="absolute"
            :style="{ left: '30px', top: deskTabTop + 'px', width: '360px', height: '130px' }"
          >
            <div
              class="absolute"
              style="
                left: 18px;
                top: 0;
                width: 300px;
                height: 130px;
                border-radius: 18px 18px 0 0;
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-bottom: none;
                background: linear-gradient(180deg, rgba(40, 41, 46, 0.5), rgba(18, 19, 22, 0.46));
                backdrop-filter: blur(10px);
              "
            ></div>
            <div
              class="absolute"
              style="
                left: 0;
                top: 16px;
                width: 340px;
                height: 130px;
                border-radius: 20px 20px 0 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-bottom: none;
                background: linear-gradient(180deg, rgba(48, 49, 55, 0.58), rgba(22, 23, 27, 0.52));
                backdrop-filter: blur(13px);
                box-shadow: 0 -12px 44px rgba(0, 0, 0, 0.4);
              "
            ></div>
            <div
              class="absolute text-white/90 font-light"
              style="
                left: 0;
                right: 0;
                top: 44px;
                font-size: 24px;
                letter-spacing: 0.4px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              {{ selectedName }}
            </div>
          </div>

          <FolderFilterPanel
            v-if="!hasFolders"
            :style-options="folderFilters.availableStyleGroups.value"
            :medium-options="folderFilters.availableMediums.value"
            :selected-style-groups="folderFilters.selectedStyleGroups.value"
            :selected-mediums="folderFilters.selectedMediums.value"
            :has-active-filters="folderFilters.hasActiveFilters.value"
            @toggle-style="handleToggleStyle"
            @toggle-medium="handleToggleMedium"
            @reset="handleResetFilters"
          />
        </div>

        <div
          v-if="hasFolders && moodboardStore.folders.length > 0"
          class="absolute"
          style="left: 100px; top: 30px; z-index: 5"
        >
          <FolderDirectory
            :folders="moodboardStore.folders"
            :active-folder-id="highlightedFolderId"
            @preview="previewFolderById"
            @preview-end="leaveFolder"
            @open="openFolderById"
          />
        </div>
      </div>

      <!-- eslint-disable vue/attribute-hyphenation -->
      <MoodboardGlassButton
        v-if="hasFolders && moodboardStore.folders.length > 0"
        data-testid="moodboard-folder-delete-toggle"
        :ariaLabel="$t('moodboard.folderDeleteToggleAria')"
        @click="toggleFolderDeleteMode"
      />

      <MoodboardGlassButton
        v-if="!hasFolders"
        data-testid="moodboard-image-delete-toggle"
        :ariaLabel="$t('moodboard.imageDeleteToggleAria')"
        @click="toggleImageSelectMode"
      />
      <!-- eslint-enable vue/attribute-hyphenation -->
      <div
        v-if="!hasFolders && isImageSelectMode"
        class="moodboard-select-actions fixed right-[90px] bottom-8 sm:right-[94px] sm:bottom-10 z-40 flex items-center gap-2"
      >
        <button
          type="button"
          class="moodboard-select-done h-10 sm:h-9 py-0 px-3.5 border-0 rounded-full text-[13px] whitespace-nowrap cursor-pointer transition duration-200 ease-[ease] hover:scale-[1.04]"
          data-testid="moodboard-select-all-images"
          @click="toggleSelectAllImages"
        >
          {{
            isAllImagesSelected
              ? $t('moodboard.deselectAllImages')
              : $t('moodboard.selectAllImages')
          }}
        </button>
        <button
          type="button"
          class="moodboard-select-done h-10 sm:h-9 py-0 px-3.5 border-0 rounded-full text-[13px] whitespace-nowrap cursor-pointer transition duration-200 ease-[ease] hover:scale-[1.04]"
          data-testid="moodboard-select-images-done"
          @click="confirmSelectedImagesDone"
        >
          {{ $t('moodboard.selectImagesDone') }}
        </button>
      </div>
    </template>

    <DeleteFolderConfirm
      v-model="isDeleteModalOpen"
      :is-deleting="isDeletingFolder"
      :folder-name="deleteTarget?.name ?? ''"
      @confirm="confirmDeleteFolder"
    />
    <DeleteImageConfirm
      v-model="isDeleteImageModalOpen"
      :is-deleting="isDeletingImage"
      @confirm="confirmDeleteImage"
    />
    <TourTransition
      v-if="
        coreTour.state.value.status === 'transition' &&
        coreTour.state.value.currentChapter === 'moodboard'
      "
      :title="$t('userTour.moodboardCompletion.title')"
      :description="$t('userTour.moodboardCompletion.description')"
      :next-description="$t('userTour.moodboardCompletion.nextDescription')"
      :proceed-label="$t('userTour.moodboardCompletion.exploreStyleDna')"
      :later-label="$t('userTour.moodboardCompletion.stay')"
      @proceed="exploreStyleDna"
      @later="stayInMoodboard"
    />
  </div>
</template>

<style scoped>
.moodboard-select-done {
  background: rgba(9, 9, 11, 0.78);
  color: var(--color-text-primary);
  font-weight: 500;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 20px rgb(0 0 0 / 0.4);
}

.moodboard-select-done:hover {
  box-shadow: 0 6px 26px rgb(0 0 0 / 0.5);
}

.moodboard-corner-orbit {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
  animation: cornerOrbitFloat 6.4s ease-in-out infinite;
}
.moodboard-corner-orbit--one {
  left: -370px;
  top: -590px;
  width: 780px;
  height: 706px;
  border: 1px solid rgba(251, 251, 251, 0.418);
}
.moodboard-corner-orbit--two {
  left: -430px;
  top: -410px;
  width: 730px;
  height: 560px;
  border: 1.3px solid rgba(248, 246, 246, 0.842);
}
.folder-directory-spine {
  position: absolute;
  left: 105px;
  top: 0;
  height: 1024px;
  width: 1.8px;
  background: rgba(240, 237, 230, 0.879);
  pointer-events: none;
  z-index: 1;
  animation: cornerOrbitFloat 6.4s ease-in-out infinite;
}
@keyframes cornerOrbitFloat {
  0%,
  100% {
    translate: 0 -12px;
  }
  50% {
    translate: 0 8px;
  }
}
@keyframes floatY {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-16px);
  }
}
.image-card {
  animation: floatY 4s ease-in-out infinite;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.photo-enter {
  animation: fadeInUp 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
.photo-placeholder {
  opacity: 0.2;
  filter: grayscale(1);
}
.photo-faded {
  opacity: 0.5;
}
.moodboard-photo-link {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.moodboard-photo-link:disabled {
  cursor: default;
  pointer-events: none;
}
.moodboard-photo-img {
  transition: transform 0.2s ease;
}
.moodboard-photo-link:hover .moodboard-photo-img {
  transform: scale(1.12);
}
</style>
