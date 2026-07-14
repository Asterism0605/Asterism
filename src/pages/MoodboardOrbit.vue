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
import MoodboardEmptyState from '@/components/feature/moodboard/MoodboardEmptyState.vue';
import MoodboardStatusDisplay from '@/components/feature/moodboard/MoodboardStatusDisplay.vue';
import ProfileCard from '@/components/ui/ProfileCard.vue';
import { showToast } from '@/composables/useToast';
import {
  NAV_H,
  INNER_K,
  ORBIT_SPEED,
  MAX_FOLDERS,
  DETAIL_CAP,
  HO,
  MW,
  MH,
  M_HOME_ORBIT,
  M_DETAIL_ORBIT,
  photos,
  mDetailBase,
  buildMoodboardOrbitImages,
  isFolderDimmed
} from '@/components/feature/moodboard/config';
import { packPhotos, ellipsePath, ellipsePathM } from '@/components/feature/moodboard/layout';
import type {
  MoodboardFolder,
  MoodboardMobilePhoto,
  MoodboardPositionedPhoto,
  SavedImage
} from '@/types/moodboard';
import { initSphere } from '@/components/feature/moodboard/sphere';
import type { SphereHandle } from '@/components/feature/moodboard/sphere';
import { useOrbitDrag } from '@/components/feature/moodboard/useOrbitDrag';
import { deleteFolder, deleteItem } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { useAuthStore } from '@/stores/auth.store';

const props = defineProps({
  height: { type: String, default: '100vh' },
  folders: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  basePath: { type: String, default: '/moodboard' }
});
const emit = defineEmits(['open', 'home']);

const DIMMED_OPACITY = 0.4;

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const moodboardStore = useMoodboardStore();
const authStore = useAuthStore();

const activeSphereFolderId = ref<string | null>(null);
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
const orbitImages = computed(() => buildMoodboardOrbitImages(sphereFolder.value?.images ?? []));

/* ---- reactive state ---- */
const scale = ref(1);
const hasFolders = ref(true);
const orbitPhase = ref(0);
const hoverIdx = ref(-1);
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
const mDetailPhotos = ref<MoodboardMobilePhoto[]>([]);
const mHomePhotosRandom = ref<MoodboardMobilePhoto[]>([]);
const deleteHoverIdx = ref(-1);
const deleteTarget = ref<{ id: string; name: string } | null>(null);
const isDeleteModalOpen = ref(false);
const isDeletingFolder = ref(false);
const deleteImageHoverIdx = ref<string | null>(null);
const deleteImageTarget = ref<{ folderId: string; itemId: string } | null>(null);
const isDeleteImageModalOpen = ref(false);
const isDeletingImage = ref(false);

// 拖拉旋轉手機/桌機共用同一顆 orbitPhase；差異只在舞台元素與軌道中心，依 isMobile 切換幾何。
const { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag } = useOrbitDrag(
  () => (isMobile.value ? mStage.value : deskStage.value),
  scale,
  orbitPhase,
  hasFolders,
  () => (isMobile.value ? M_HOME_ORBIT : HO),
  // 手機/桌機都只有點在資料夾附近才起拖。
  (p) => (isMobile.value ? nearMobileFolder(p) : nearDeskFolder(p))
);

// pointerdown 是否落在任一手機資料夾範圍內（含 18px 邊距）。
function nearMobileFolder(p: { x: number; y: number }): boolean {
  const m = 18;
  return mFolders.value.some(
    (f) => Math.abs(p.x - f.cx) <= f.w / 2 + m && Math.abs(p.y - f.cy) <= f.h / 2 + m
  );
}

// 桌機同理：只算目前顯示（onLine）的資料夾，用其 left/top + 尺寸還原中心點判定（含 18px 邊距）。
function nearDeskFolder(p: { x: number; y: number }): boolean {
  const m = 18;
  return folderView.value.some((fv) => {
    if (!fv.onLine) return false;
    const w = fv.w + 20;
    const h = fv.h + 30;
    const cx = fv.left + w / 2;
    const cy = fv.top + h / 2;
    return Math.abs(p.x - cx) <= w / 2 + m && Math.abs(p.y - cy) <= h / 2 + m;
  });
}

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
    pointerEvents: 'none'
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

const showLeader = computed(() => hasFolders.value && hoverIdx.value >= 0);
const showEmpty = computed(() => moodboardStore.status === 'idle' || moodboardStore.isEmpty);

function getFolderName(index: number): string {
  return folderNames.value[index] ?? '';
}

function hoverFolder(index: number) {
  const folder = moodboardStore.folders[index];
  if (!folder?.images.length) return;

  hoverIdx.value = index;
  activeSphereFolderId.value = folder.id;
}

function leaveFolder() {
  hoverIdx.value = -1;
}

// deleteHoverIdx 獨立於 hoverFolder：空資料夾（0 張圖片）也要能 hover 顯示刪除 icon
function onFolderMouseEnter(index: number) {
  deleteHoverIdx.value = index;
  hoverFolder(index);
}

function onFolderMouseLeave() {
  deleteHoverIdx.value = -1;
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
    deleteHoverIdx.value = -1;
    mHover.value = -1;
  } catch {
    showToast({ type: 'error', message: t('toast.deleteFolderFailed') });
  } finally {
    isDeletingFolder.value = false;
  }
}

function requestDeleteImage(itemId: string) {
  const folder = moodboardStore.folders[selectedFolder.value];
  if (!folder || !folder.images.some((image) => image.itemId === itemId)) return;

  deleteImageTarget.value = { folderId: folder.id, itemId };
  isDeleteImageModalOpen.value = true;
}

async function confirmDeleteImage() {
  const profileId = authStore.user?.id;
  if (!deleteImageTarget.value || isDeletingImage.value || !profileId) return;

  const { folderId, itemId } = deleteImageTarget.value;
  isDeletingImage.value = true;
  try {
    await deleteItem(folderId, itemId);
    moodboardStore.removeImage(folderId, itemId);
    scatter.value = scatter.value.filter((n) => n.itemId !== itemId);
    mDetailPhotos.value = mDetailPhotos.value.filter((p) => p.itemId !== itemId);
    isDeleteImageModalOpen.value = false;
    deleteImageTarget.value = null;
    deleteImageHoverIdx.value = null;
  } catch {
    showToast({ type: 'error', message: t('toast.deleteImageFailed') });
  } finally {
    isDeletingImage.value = false;
  }
}

function toPhotos(images: SavedImage[], mobile = false) {
  const sizes = mobile ? mDetailBase : photos;

  return images.map((image, index) => ({
    src: image.src,
    itemId: image.itemId,
    w: sizes[index % sizes.length].w,
    h: sizes[index % sizes.length].h
  }));
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
  const list = toPhotos(
    moodboardStore.folders[selectedFolder.value]?.images.slice(0, DETAIL_CAP) ?? []
  );
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
    y: d.y
  }));
}

function buildMobileDetail() {
  const o = M_DETAIL_ORBIT;
  const photoFloorBottom = mDesignH.value - 138;
  const list = toPhotos(
    moodboardStore.folders[selectedFolder.value]?.images.slice(0, DETAIL_CAP) ?? [],
    true
  );
  const nodes = packPhotos(list, {
    idPrefix: 'md',
    cx: o.cx,
    cy: o.cy,
    rx: o.rx,
    ry: o.ry,
    gap: 10,
    xMin: 16,
    xMax: 424,
    yMin: 196,
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
    cy: d.y
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
    yMin: 200,
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
  if (!moodboardStore.folders[i]) return;

  selectedFolder.value = i;
  hasFolders.value = false;
  if (isMobile.value) buildMobileDetail();
  else buildDetail();
  navigate(slugFor(i), i);
}

function slugFor(i: number) {
  const name = getFolderName(i) || 'folder-' + i;
  return encodeURIComponent(name.trim().replace(/\s+/g, '-').toLowerCase());
}

function navigate(slug: string, i: number) {
  const path = props.basePath + (slug ? '/' + slug : '');
  router.push(path);
  if (slug) emit('open', { index: i, name: getFolderName(i), slug, path });
  else emit('home', { path });
}

function goHome() {
  hasFolders.value = true;
  hoverIdx.value = -1;
  mHover.value = -1;
  dragging.value = false;
  navigate('', -1);
}

watch(
  () => route.params.slug,
  (slug) => {
    if (!slug && !hasFolders.value) {
      hasFolders.value = true;
      hoverIdx.value = -1;
      mHover.value = -1;
    }
  }
);

function onFolderClick(i: number) {
  if (consumeDidDrag()) return;
  openFolder(i);
}

function hoverMobileFolderAt(i: number) {
  if (!moodboardStore.folders[i]) return;
  mHover.value = i;
}

let sphereHandle: SphereHandle | null = null;
let orbitRaf = 0;
let orbitLast: number | null = null;

function orbitLoop(ts: number) {
  if (orbitLast === null) orbitLast = ts;
  const dt = Math.min(0.05, (ts - orbitLast) / 1000);
  orbitLast = ts;
  if (hasFolders.value && !dragging.value && hoverIdx.value < 0 && mHover.value < 0)
    orbitPhase.value += ORBIT_SPEED * dt;
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
    orbitImages.value
  );
}

watch(orbitImages, () => nextTick(initializeSphere));

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
  if (isMobile.value) buildMobileHome();
  nextTick(initializeSphere);
  orbitRaf = requestAnimationFrame(orbitLoop);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(orbitRaf);
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
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
        @pointerleave="onDragEnd"
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
          class="absolute inset-0"
          :style="{ cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }"
        >
          <div
            v-for="f in mFolders"
            :key="'mf' + f.i"
            :data-testid="`moodboard-folder-mobile-${f.i}`"
            class="absolute"
            :style="{
              left: f.cx - f.w / 2 + 'px',
              top: f.cy - f.h / 2 + 'px',
              width: f.w + 'px',
              height: f.h + 'px',
              transform: mHover === f.i ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform .22s ease',
              zIndex: mHover === f.i ? 20 : 5,
              cursor: f.hasFolder ? 'pointer' : 'default',
              pointerEvents: f.hasFolder ? 'auto' : 'none'
            }"
            @pointerenter="hoverMobileFolderAt(f.i)"
            @pointerleave="mHover = -1"
            @click="onFolderClick(f.i)"
          >
            <img
              :src="mHover === f.i ? '/images/folder-active.png' : '/images/folder-idle.png'"
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
              v-if="f.hasFolder"
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

          <!-- folder name appears only while a folder is hovered/pressed -->
          <div
            class="absolute"
            :style="{
              left: '28px',
              top: '100px',
              pointerEvents: 'none',
              opacity: mHover >= 0 ? 1 : 0,
              transform: mHover >= 0 ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity .3s ease, transform .3s ease'
            }"
          >
            <div
              class="absolute"
              style="
                left: -26px;
                top: -22px;
                width: 240px;
                height: 118px;
                border-radius: 34px;
                background: radial-gradient(
                  58% 56% at 30% 46%,
                  rgba(9, 9, 11, 0.72),
                  rgba(9, 9, 11, 0)
                );
                filter: blur(5px);
              "
            ></div>
            <div
              class="relative text-white"
              style="
                font-size: 21px;
                font-weight: 400;
                letter-spacing: 0.4px;
                text-shadow:
                  0 2px 18px rgba(0, 0, 0, 0.7),
                  0 0 14px rgba(255, 255, 255, 0.14);
              "
            >
              {{ mHover >= 0 ? getFolderName(mHover) : '' }}
            </div>
            <div class="relative flex items-center" style="gap: 8px; margin-top: 14px">
              <span
                style="
                  width: 7px;
                  height: 7px;
                  border-radius: 50%;
                  background: #eaecf0;
                  box-shadow: 0 0 8px rgba(234, 236, 240, 0.7);
                  flex: 0 0 auto;
                "
              ></span>
              <span
                style="
                  height: 1.5px;
                  width: 138px;
                  background: linear-gradient(
                    90deg,
                    rgba(234, 236, 240, 0.95),
                    rgba(234, 236, 240, 0.28)
                  );
                "
              ></span>
            </div>
          </div>
        </div>

        <!-- photos (peek on home, randomised + fade-in on detail) -->
        <!-- outer = entrance fade/slide (staggered); inner = idle float -->
        <div
          v-for="p in mPhotoView"
          :key="p.id"
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
            <img
              :src="p.src"
              draggable="false"
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
            <DeleteIconButton
              v-if="p.itemId"
              :data-testid="`image-delete-mobile-${p.itemId}`"
              :aria-label="$t('moodboard.deleteImageAria')"
              :style="{ position: 'absolute', top: '-12px', right: '-12px', zIndex: 40 }"
              @delete="requestDeleteImage(p.itemId)"
            />
          </div>
        </div>

        <!-- header: asterisk logo + profile (shared ProfileCard, sm size to fit compact header) -->
        <div v-if="authStore.isAuthenticated" class="absolute" style="left: 20px; top: 28px">
          <ProfileCard
            avatar-size="sm"
            class="p-0!"
            :name="authStore.user?.displayName ?? ''"
            :subtitle="authStore.user?.email ?? ''"
          />
        </div>

        <!-- detail: back (just above the name tab) + docked folder-name tab -->
        <div v-show="!hasFolders" class="absolute inset-0 pointer-events-none">
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
        class="relative"
        :style="stageStyle"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
        @pointerleave="onDragEnd"
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

        <!-- ===== STATE A : HAS FOLDERS (orbit + photo sphere) ===== -->
        <div
          v-show="hasFolders"
          class="absolute inset-0"
          :style="{ cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }"
        >
          <canvas ref="sphereCanvas" class="absolute" :style="sphereStyle"></canvas>

          <!-- folder images orbit the ellipse; hovering swaps to the active image + pauses the orbit -->
          <div
            v-for="fv in folderView"
            :key="'f' + fv.i"
            :data-testid="`moodboard-folder-${fv.i}`"
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
              v-if="fv.hasFolder"
              :data-testid="`folder-delete-${fv.i}`"
              :size="28"
              :icon-size="20"
              :style="{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                opacity: deleteHoverIdx === fv.i ? 1 : 0,
                pointerEvents: deleteHoverIdx === fv.i ? 'auto' : 'none',
                transition: 'opacity .2s ease',
                zIndex: 40
              }"
              @delete="requestDeleteFolder(fv.i)"
            />
          </div>
        </div>

        <!-- ===== DETAIL PAGE : opened folder — photos randomly arranged (static, non-overlapping) inside the visible circle ===== -->
        <div v-show="!hasFolders" class="absolute inset-0">
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
            @mouseenter="n.itemId && (deleteImageHoverIdx = n.itemId)"
            @mouseleave="deleteImageHoverIdx = null"
          >
            <img
              :src="n.src"
              draggable="false"
              class="w-full h-full block select-none"
              style="object-fit: cover; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55)"
              @error="onImgError"
            />
            <div
              class="w-full h-full"
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
            <DeleteIconButton
              v-if="n.itemId"
              :data-testid="`image-delete-${n.itemId}`"
              :aria-label="$t('moodboard.deleteImageAria')"
              :style="{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                zIndex: 40,
                opacity: deleteImageHoverIdx === n.itemId ? 1 : 0,
                pointerEvents: deleteImageHoverIdx === n.itemId ? 'auto' : 'none',
                transition: 'opacity .2s ease'
              }"
              @delete="requestDeleteImage(n.itemId)"
            />
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
        </div>

        <!-- ===== PROFILE (teammate's ProfileCard component, sm size — 組長回饋原尺寸太大，
             介於改動前的 scale(0.5) 跟改動後全尺寸之間) ===== -->
        <div v-if="authStore.isAuthenticated" class="absolute" style="left: 100px; top: 150px">
          <ProfileCard
            avatar-size="sm"
            :name="authStore.user?.displayName ?? ''"
            :subtitle="authStore.user?.email ?? ''"
          />
        </div>

        <!-- hover title block: dark halo + glowing title + underline with a dot at its left -->
        <div
          class="absolute"
          :style="{
            left: '150px',
            top: '300px',
            pointerEvents: 'none',
            opacity: showLeader ? 1 : 0,
            transform: showLeader ? 'translateY(0)' : 'translateY(8px)',
            transition: showLeader ? 'opacity .32s ease, transform .32s ease' : 'none'
          }"
        >
          <div
            class="absolute"
            style="
              left: -34px;
              top: -26px;
              width: 330px;
              height: 150px;
              border-radius: 40px;
              background: radial-gradient(
                58% 56% at 32% 46%,
                rgba(9, 9, 11, 0.72),
                rgba(9, 9, 11, 0)
              );
              filter: blur(5px);
            "
          ></div>
          <div
            class="relative text-white"
            style="
              font-size: 16px;
              font-weight: 400;
              letter-spacing: 0.6px;
              text-shadow:
                0 2px 22px rgba(0, 0, 0, 0.7),
                0 0 18px rgba(255, 255, 255, 0.14);
            "
          >
            {{ getFolderName(hoverIdx) }}
          </div>
          <div class="relative flex items-center" style="gap: 10px; margin-top: 20px">
            <span
              style="
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background: #eaecf0;
                box-shadow: 0 0 10px rgba(234, 236, 240, 0.7);
                flex: 0 0 auto;
              "
            ></span>
            <span
              style="
                height: 1.5px;
                width: 188px;
                background: linear-gradient(
                  90deg,
                  rgba(234, 236, 240, 0.95),
                  rgba(234, 236, 240, 0.28)
                );
              "
            ></span>
          </div>
        </div>
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
  </div>
</template>

<style scoped>
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
</style>
