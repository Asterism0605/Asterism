<script setup lang="ts">
// src/components/feature/moodboard/
//   config.ts         — 常數與靜態資料
//   layout.ts         — 純幾何算法（packPhotos, ellipsePath...）
//   sphere.ts         — Three.js 球體邏輯
//   useMobileOrbit.ts — 手機拖曳 composable
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ProfileCard from '@/components/ui/ProfileCard.vue';
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
  folderNames,
  photos,
  mDetailBase,
  mHomePhotos
} from '@/components/feature/moodboard/config';
import { packPhotos, ellipsePath, ellipsePathM } from '@/components/feature/moodboard/layout';
import type { MoodboardMobilePhoto, MoodboardPositionedPhoto } from '@/types/moodboard';
import { initSphere } from '@/components/feature/moodboard/sphere';
import type { SphereHandle } from '@/components/feature/moodboard/sphere';
import { useMobileOrbit } from '@/components/feature/moodboard/useMobileOrbit';

const props = defineProps({
  height: { type: String, default: '100vh' },
  folders: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  basePath: { type: String, default: '/moodboard' }
});
const emit = defineEmits(['open', 'home']);

const router = useRouter();
const route = useRoute();

const folderCount = ref(10);

/* ---- reactive state ---- */
const scale = ref(1);
const hasFolders = ref(true);
const orbitPhase = ref(0);
const hoverIdx = ref(-1);
const selectedFolder = ref(0);
const selectedName = computed(() => folderNames[selectedFolder.value % folderNames.length]);
const scatter = ref<MoodboardPositionedPhoto[]>([]);
const sphereCanvas = ref<HTMLCanvasElement | null>(null);
const isMobile = ref(false);
const deskVisibleH = ref(1024);
const deskBackTop = computed(() => Math.round(deskVisibleH.value - 130));
const deskTabTop = computed(() => Math.round(deskVisibleH.value - 96));
const mStage = ref<HTMLElement | null>(null);
const mDesignH = ref(MH);
const mDetailPhotos = ref<MoodboardMobilePhoto[]>([]);
const mHomePhotosRandom = ref<MoodboardMobilePhoto[]>([]);

const { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag } = useMobileOrbit(
  mStage,
  scale,
  orbitPhase,
  hasFolders
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
    n = Math.min(folderCount.value, MAX_FOLDERS),
    w = 86,
    h = 66;
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + orbitPhase.value;
    return { i, cx: o.cx + o.rx * Math.cos(ang), cy: o.cy + o.ry * Math.sin(ang), w, h };
  });
});

const mPhotoView = computed(() => {
  if (hasFolders.value) return mHomePhotosRandom.value;
  return mDetailPhotos.value;
});

const outerPath = computed(() => ellipsePath(1));
const innerPath = computed(() => ellipsePath(INNER_K));

const folderView = computed(() => {
  const n = Math.min(folderCount.value, MAX_FOLDERS),
    w = 100,
    h = 50;
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + orbitPhase.value;
    const cx = HO.cx + HO.rx * Math.cos(ang);
    const cy = HO.cy + HO.ry * Math.sin(ang);
    const deg = ((((ang * 180) / Math.PI) % 360) + 360) % 360;
    const onLine = deg >= 105 && deg <= 350;
    return {
      i,
      w,
      h,
      active: hoverIdx.value === i,
      onLine,
      left: cx - w / 2 - 10,
      top: cy - h / 2 - 30
    };
  });
});

const showLeader = computed(() => hasFolders.value && hoverIdx.value >= 0);

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
  const ph = img.nextElementSibling as HTMLElement | null;
  if (ph) ph.style.display = 'block';
}

function buildDetail() {
  const o = HO;
  const floor = deskVisibleH.value;
  const list = photos.slice(0, DETAIL_CAP);
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
  const nodes = packPhotos(mDetailBase, {
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
  const list = mHomePhotos.map((p) => ({ src: p.src, w: p.w, h: p.h, faded: p.faded }));
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
    delay: d.delay,
    cx: d.x,
    cy: d.y
  }));
}

function openFolder(i: number) {
  selectedFolder.value = i;
  hasFolders.value = false;
  if (isMobile.value) buildMobileDetail();
  else buildDetail();
  navigate(slugFor(i), i);
}

function slugFor(i: number) {
  const name = folderNames[i % folderNames.length] || 'folder-' + i;
  return encodeURIComponent(name.trim().replace(/\s+/g, '-').toLowerCase());
}

function navigate(slug: string, i: number) {
  const path = props.basePath + (slug ? '/' + slug : '');
  router.push(path);
  if (slug) emit('open', { index: i, name: folderNames[i % folderNames.length], slug, path });
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

onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
  if (isMobile.value) buildMobileHome();
  nextTick(() => {
    if (sphereCanvas.value) {
      sphereHandle = initSphere(
        sphereCanvas.value,
        () => scale.value,
        () => hasFolders.value
      );
    }
  });
  orbitRaf = requestAnimationFrame(orbitLoop);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(orbitRaf);
  if (sphereHandle) sphereHandle.dispose();
});
</script>

<template>
  <div
    class="relative w-full overflow-hidden"
    :style="{ background: '#0b0b0d', height: `calc(100vh - ${NAV_H}px)`, marginTop: `${NAV_H}px` }"
  >
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
        :style="{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }"
      >
        <div
          v-for="f in mFolders"
          :key="'mf' + f.i"
          class="absolute"
          :style="{
            left: f.cx - f.w / 2 + 'px',
            top: f.cy - f.h / 2 + 'px',
            width: f.w + 'px',
            height: f.h + 'px',
            transform: mHover === f.i ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform .22s ease',
            zIndex: mHover === f.i ? 20 : 5,
            cursor: 'pointer'
          }"
          @pointerenter="mHover = f.i"
          @pointerleave="mHover = -1"
          @click="onFolderClick(f.i)"
        >
          <img
            :src="mHover === f.i ? '/images/folder-active.png' : '/images/folder-idle.png'"
            draggable="false"
            class="w-full h-full select-none"
            style="
              object-fit: contain;
              display: block;
              pointer-events: none;
              filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.5));
            "
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
            {{ mHover >= 0 ? folderNames[mHover % folderNames.length] : '' }}
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
          :style="{ opacity: p.faded ? 0.5 : 1, animationDelay: p.delay + 's' }"
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
        </div>
      </div>

      <!-- header: asterisk logo + plain profile (NAME kept compact) -->
      <div class="absolute flex items-center gap-3" style="left: 20px; top: 28px">
        <div
          style="
            width: 34px;
            height: 34px;
            border-radius: 9999px;
            background: radial-gradient(120% 120% at 35% 30%, #e9eaec, #c0c1c4 60%, #9c9da0);
          "
        ></div>
        <div style="line-height: 1.25">
          <div
            class="text-white/90"
            style="font-size: 12px; font-weight: 500; letter-spacing: 0.5px"
          >
            NAME
          </div>
          <div class="text-white/45" style="font-size: 11px">alawhoagua@gmail.com</div>
        </div>
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
          <span style="font-size: 19px; line-height: 1">&larr;</span> Back
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
    <div v-else class="relative" :style="stageStyle">
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
      <div v-show="hasFolders" class="absolute inset-0">
        <canvas ref="sphereCanvas" class="absolute" :style="sphereStyle"></canvas>

        <!-- folder images orbit the ellipse; hovering swaps to the active image + pauses the orbit -->
        <div
          v-for="fv in folderView"
          :key="'f' + fv.i"
          class="absolute"
          :style="{
            left: fv.left + 'px',
            top: fv.top + 'px',
            width: fv.w + 20 + 'px',
            height: fv.h + 30 + 'px',
            transform: fv.active ? 'scale(1.07)' : 'scale(1)',
            transformOrigin: 'center center',
            transition: 'transform .28s ease, opacity .35s ease',
            opacity: fv.onLine ? 1 : 0,
            pointerEvents: fv.onLine ? 'auto' : 'none',
            zIndex: fv.active ? 30 : 2,
            cursor: 'pointer'
          }"
          @mouseenter="hoverIdx = fv.i"
          @mouseleave="hoverIdx = -1"
          @click="openFolder(fv.i)"
        >
          <img
            :src="fv.active ? '/images/folder-active.png' : '/images/folder-idle.png'"
            draggable="false"
            class="w-full h-full select-none"
            style="object-fit: contain; display: block; pointer-events: none"
          />
        </div>
      </div>

      <!-- ===== DETAIL PAGE : opened folder — photos randomly arranged (static, non-overlapping) inside the visible circle ===== -->
      <div v-show="!hasFolders" class="absolute inset-0">
        <div
          v-for="n in scatter"
          :key="n.id"
          class="absolute image-card"
          :style="{
            left: n.x - n.w / 2 + 'px',
            top: n.y - n.h / 2 + 'px',
            width: n.w + 'px',
            height: n.h + 'px',
            animationDelay: n.delay + 's'
          }"
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
            <span style="font-size: 20px; line-height: 1">&larr;</span> Back
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

      <!-- ===== PROFILE (teammate's ProfileCard component, scaled down a touch) ===== -->
      <div
        class="absolute"
        style="left: 100px; top: 150px; transform: scale(0.5); transform-origin: top left"
      >
        <ProfileCard name="NAME" subtitle="alawhoagua@gmail.com" />
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
          {{ folderNames[hoverIdx % folderNames.length] }}
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
</style>
