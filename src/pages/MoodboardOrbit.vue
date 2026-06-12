<!--
  MoodboardOrbit.vue — drop-in Single File Component (Vue 3 + Tailwind)

  Install deps:   npm i three d3-force
  Assets:         folder PNGs in  public/images/folder-idle.png + folder-active.png
                  photos in       public/images/image1.png … image5.png
  Tailwind:       this component uses a few Tailwind utility classes
                  (you mentioned Vue + Tailwind). Everything else is inline.

  Two pages:
    • home   (hasFolders = true)  → folder images orbit the ellipse + Three.js photo sphere.
                                    hovering a folder pauses the orbit, swaps it to the
                                    active (white) image, and shows the "Project Title" label + underline.
    • detail (hasFolders = false) → click a folder to open it; its photos are randomly
                                    arranged (static, no animation) inside the orbit circle
-->
<template>
  <div
    class="relative w-full overflow-hidden flex items-center justify-center"
    :style="{ background: '#0b0b0d', height: height }"
  >
    <!-- ===================== MOBILE STAGE (440×956) ===================== -->
    <div
      v-if="isMobile"
      class="relative"
      ref="mStage"
      :style="mStageStyle"
      @pointerdown="onDragStart"
      @pointermove="onDragMove"
      @pointerup="onDragEnd"
      @pointercancel="onDragEnd"
      @pointerleave="onDragEnd"
    >
      <!-- orbit lines (normal arc on home, flipped smile on detail) -->
      <svg
        class="absolute inset-0 pointer-events-none"
        width="440"
        height="956"
        viewBox="0 0 440 956"
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
          @pointerenter="mHover = f.i"
          @pointerleave="mHover = -1"
          @click="onFolderClick(f.i)"
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

        <!-- Project Title appears only while a folder is hovered/pressed -->
        <div
          class="absolute"
          :style="{
            left: '28px',
            top: '150px',
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
            Project Title
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

      <!-- photos (peek on home, enlarged on detail) -->
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
            @error="onImgError"
            draggable="false"
            class="w-full h-full block select-none"
            style="object-fit: cover; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55)"
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

      <!-- header: plain profile -->
      <div class="absolute flex items-center gap-4" style="left: 20px; top: 80px">
        <div
          style="
            width: 40px;
            height: 40px;
            border-radius: 9999px;
            background: radial-gradient(120% 120% at 35% 30%, #e9eaec, #c0c1c4 60%, #9c9da0);
          "
        ></div>
        <div style="line-height: 1.25">
          <div
            class="text-white/90"
            style="font-size: 18px; font-weight: 400; letter-spacing: 0.6px"
          >
            NAME
          </div>
          <div class="text-white/45" style="font-size: 13px">alawhoagua@gmail.com</div>
        </div>
      </div>

      <!-- detail: back + docked Project Title tab -->
      <div v-show="!hasFolders" class="absolute inset-0 pointer-events-none">
        <button
          @click="goHome"
          class="absolute flex items-center gap-2"
          style="
            left: 18px;
            top: 20px;
            height: 40px;
            padding: 0 16px 0 12px;
            border-radius: 999px;
            color: #f0ede6;
            font-size: 15px;
            font-weight: 400;
            cursor: pointer;
            pointer-events: auto;
            background: rgba(20, 21, 24, 0.55);
            border: 1px solid rgba(255, 255, 255, 0.16);
            backdrop-filter: blur(12px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          "
        >
          <span style="font-size: 19px; line-height: 1">&larr;</span> Back
        </button>
        <div
          class="absolute"
          style="left: 0; right: 0; bottom: 0; height: 96px; pointer-events: auto"
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
              border-radius: 26px 26px 0 0;
              background: linear-gradient(180deg, rgba(54, 55, 61, 0.62), rgba(24, 25, 29, 0.58));
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-bottom: none;
              box-shadow: 0 -14px 50px rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <span
              class="text-white/90"
              style="font-size: 21px; font-weight: 400; letter-spacing: 0.5px"
              >Project Title</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== DESKTOP STAGE (1440×1024) ===================== -->
    <div v-else class="relative" :style="stageStyle">
      <!-- ===== ORBIT LINES (two converging ellipses) ===== -->
      <svg
        class="absolute inset-0 pointer-events-none"
        width="1440"
        height="1024"
        viewBox="0 0 1440 1024"
        fill="none"
      >
        <path
          :d="hasFolders ? outerPath : outerPathFlip"
          stroke="rgba(220,222,228,0.45)"
          stroke-width="1"
          fill="none"
        />
        <path
          :d="hasFolders ? innerPath : innerPathFlip"
          stroke="rgba(220,222,228,0.32)"
          stroke-width="1"
          fill="none"
        />
      </svg>

      <!-- ===== STATE A : HAS FOLDERS (orbit + photo sphere) ===== -->
      <div v-show="hasFolders" class="absolute inset-0">
        <canvas
          ref="sphereCanvas"
          class="absolute"
          style="left: 420px; top: 80px; width: 880px; height: 840px; pointer-events: none"
        ></canvas>

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

      <!-- ===== DETAIL PAGE : opened folder — photos randomly arranged (static) inside the circle ===== -->
      <div v-show="!hasFolders" class="absolute inset-0">
        <div
          v-for="n in scatter"
          :key="n.id"
          class="absolute image-card"
          :style="{
            left: n.x - n.w / 2 + 'px',
            top: n.y - n.h / 2 + 'px',
            width: n.w + 'px',
            height: n.h + 'px'
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

        <!-- back link -->
        <div class="absolute" style="left: 30px; top: 928px">
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
        <!-- docked project folder tab -->
        <div class="absolute" style="left: -14px; top: 958px; width: 360px; height: 130px">
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
            style="left: 34px; top: 44px; font-size: 24px; letter-spacing: 0.4px"
          >
            Project Title
          </div>
        </div>
      </div>

      <!-- ===== PROFILE (teammate's ProfileCard component) ===== -->
      <div class="absolute" style="left: 34px; top: 150px">
        <ProfileCard name="NAME" subtitle="alawhoagua@gmail.com" />
      </div>

      <!-- hover title block: dark halo + glowing title + underline with a dot at its left -->
      <div
        class="absolute"
        :style="{
          left: '126px',
          top: '338px',
          pointerEvents: 'none',
          opacity: showLeader ? 1 : 0,
          transform: showLeader ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity .32s ease, transform .32s ease'
        }"
      >
        <!-- soft dark halo for legibility over the busy sphere/photos -->
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
            font-size: 31px;
            font-weight: 400;
            letter-spacing: 0.6px;
            text-shadow:
              0 2px 22px rgba(0, 0, 0, 0.7),
              0 0 18px rgba(255, 255, 255, 0.14);
          "
        >
          Project Title
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

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  height: { type: String, default: '100vh' },
  folders: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] }
});
import * as THREE from 'three';
import { forceSimulation, forceManyBody, forceCollide, forceX, forceY } from 'd3-force';
import ProfileCard from '../components/ui/ProfileCard.vue';

/* ---- DETAIL ellipse (flipped "smile" + photo containment on the opened-folder page) ---- */
const CX = 903.8,
  CY = 761.8,
  RX = 641.0,
  RY = 621.5;
const INNER_K = 0.9;
const NODE = { x: 1098, y: 170 };

/* ---- HOME orbit: a near-circle kept fully inside the 1440×1024 stage so EVERY
   folder stays on screen at all times while still revolving. ---- */
const HO = { cx: 860, cy: 500, rx: 440, ry: 400, node: { x: 1143, y: 194 } };
const MAX_FOLDERS = 10;
const folderCount = ref(10); // demo count; capped at MAX_FOLDERS, all stay visible

/* ---- folders are generated evenly around the home orbit (HO) in folderView() ---- */

/* ---- the user's collected photos (cycle image1..image5; edit freely) ---- */
const photos = [
  { src: '/images/image1.png', w: 118, h: 80 },
  { src: '/images/image2.png', w: 150, h: 196 },
  { src: '/images/image3.png', w: 98, h: 170 },
  { src: '/images/image4.png', w: 116, h: 98 },
  { src: '/images/image5.png', w: 236, h: 326 },
  { src: '/images/image1.png', w: 138, h: 152 },
  { src: '/images/image2.png', w: 156, h: 198 },
  { src: '/images/image3.png', w: 154, h: 122 },
  { src: '/images/image4.png', w: 184, h: 118 },
  { src: '/images/image5.png', w: 98, h: 132 },
  { src: '/images/image1.png', w: 122, h: 152 }
];
const IMG_URLS = photos.map((p) => p.src); // sphere uses the same set
const SPRITE_RADIUS = 2.15;

/* ---- reactive state ---- */
const scale = ref(1);
const hasFolders = ref(true);
const orbitPhase = ref(0);
const hoverIdx = ref(-1);
const selectedFolder = ref(0);
const scatter = ref([]);
const sphereCanvas = ref(null);
const isMobile = ref(false);
// mobile orbit interaction
const mHover = ref(-1);
const dragging = ref(false);
let didDrag = false;
let dragStart = null;
let dragLastAng = 0;
const mStage = ref(null);

/* ---- derived ---- */
const stageStyle = computed(() => ({
  width: '1440px',
  height: '1024px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
  flex: '0 0 auto'
}));

/* =================== MOBILE (440×956) =================== */
const MW = 440,
  MH = 956;
const mDesignH = ref(MH); // fluid design-height so the bottom stays anchored on short screens
const mStageStyle = computed(() => ({
  // mobile fills the viewport WIDTH (so the orbit always reaches the side edges on any
  // aspect ratio, incl. iPhone SE) with a fluid design-height; anchored top-left.
  position: 'absolute',
  left: '0',
  top: '0',
  width: MW + 'px',
  height: mDesignH.value + 'px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}));
// mobile orbit params: home = arc through the folder row, detail = shallow smile across the top
const M_HOME_ORBIT = { cx: 220, cy: 815, rx: 345, ry: 575, node: { x: 346, y: 280 } };
const M_DETAIL_ORBIT = { cx: 220, cy: -120, rx: 370, ry: 440, node: { x: 430, y: 242 } };
function ellipsePathM(o, k) {
  const pts = [];
  for (let t = 0; t <= 360; t += 2) {
    const r = (t * Math.PI) / 180;
    let x = o.cx + o.rx * Math.cos(r);
    let y = o.cy + o.ry * Math.sin(r);
    x = o.node.x + k * (x - o.node.x);
    y = o.node.y + k * (y - o.node.y);
    pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return 'M' + pts.join(' L') + ' Z';
}
const mOrbitOuter = computed(() =>
  ellipsePathM(hasFolders.value ? M_HOME_ORBIT : M_DETAIL_ORBIT, 1)
);
const mOrbitInner = computed(() =>
  ellipsePathM(hasFolders.value ? M_HOME_ORBIT : M_DETAIL_ORBIT, 0.9)
);
// up to MAX_FOLDERS spread evenly around the home orbit, sharing the travel phase.
// on mobile they may sit off-screen; the user drags the orbit to bring one into view.
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
const mImg = (n) => '/images/image' + n + '.png';
// home: a small photo "peek" lower on the screen
const mHomePhotos = [
  { id: 'h0', src: mImg(4), cx: 140, cy: 447, w: 52, h: 52 },
  { id: 'h1', src: mImg(5), cx: 313, cy: 517, w: 108, h: 130 },
  { id: 'h2', src: mImg(2), cx: 80, cy: 614, w: 80, h: 96 },
  { id: 'h3', src: mImg(3), cx: 217, cy: 656, w: 44, h: 52, faded: true },
  { id: 'h4', src: mImg(1), cx: 128, cy: 785, w: 58, h: 64 },
  { id: 'h5', src: mImg(5), cx: 294, cy: 853, w: 104, h: 96 }
];
// detail photo set (sizes/sources only; positions are randomised on open)
const mDetailBase = [
  { src: mImg(4), w: 58, h: 66 },
  { src: mImg(5), w: 120, h: 140 },
  { src: mImg(3), w: 44, h: 70, faded: true },
  { src: mImg(2), w: 84, h: 104 },
  { src: mImg(3), w: 46, h: 74 },
  { src: mImg(1), w: 66, h: 72 },
  { src: mImg(5), w: 108, h: 96 },
  { src: mImg(2), w: 72, h: 92 },
  { src: mImg(4), w: 60, h: 54 }
];
const mDetailPhotos = ref([]);
const mBuildSeq = ref(0);
// randomly arrange the folder's photos inside the body, no overlap (static), each time it opens
function buildMobileDetail() {
  mBuildSeq.value++;
  const seq = mBuildSeq.value;
  const R = { x0: 42, x1: 398, y0: 200, y1: 792 }; // body region (below header, above tab)
  const base = mDetailBase;
  const n = base.length,
    cols = 3,
    rows = Math.ceil(n / cols);
  const cellW = (R.x1 - R.x0) / cols,
    cellH = (R.y1 - R.y0) / rows;
  const cells = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) cells.push([cx, cy]);
  for (let k = cells.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [cells[k], cells[j]] = [cells[j], cells[k]];
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const nodes = base.map((p, idx) => {
    const [cx, cy] = cells[idx];
    const tx = R.x0 + cellW * (cx + 0.5) + rnd(-cellW * 0.26, cellW * 0.26);
    const ty = R.y0 + cellH * (cy + 0.5) + rnd(-cellH * 0.26, cellH * 0.26);
    return {
      id: 'd' + seq + '-' + idx,
      src: p.src,
      w: p.w,
      h: p.h,
      faded: p.faded,
      x: tx,
      y: ty,
      tx,
      ty
    };
  });
  const contain = () => {
    for (const d of nodes) {
      d.x = Math.max(R.x0 + d.w / 2, Math.min(R.x1 - d.w / 2, d.x));
      d.y = Math.max(R.y0 + d.h / 2, Math.min(R.y1 - d.h / 2, d.y));
    }
  };
  const sim = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-10))
    .force(
      'collide',
      forceCollide()
        .radius((d) => (Math.hypot(d.w, d.h) / 2) * 0.56 + 7)
        .strength(1)
        .iterations(3)
    )
    .force('x', forceX((d) => d.tx).strength(0.18))
    .force('y', forceY((d) => d.ty).strength(0.18))
    .stop();
  for (let k = 0; k < 300; k++) {
    sim.tick();
    contain();
  }
  mDetailPhotos.value = nodes.map((d) => ({
    id: d.id,
    src: d.src,
    w: d.w,
    h: d.h,
    faded: d.faded,
    cx: d.x,
    cy: d.y
  }));
}
const mPhotoView = computed(() => {
  const src = hasFolders.value ? mHomePhotos : mDetailPhotos.value;
  return src.map((p, i) => ({ ...p, delay: (i * 0.06).toFixed(2) }));
});

function ellipsePath(k, flip) {
  // home (non-flip) uses the on-screen HO orbit; detail (flip) uses the big CX/CY ellipse.
  // the HOME line is an OPEN arc omitting the bottom-right corner; detail is a closed loop.
  const o = flip ? { cx: CX, cy: CY, rx: RX, ry: RY, node: NODE } : HO;
  const cyc = flip ? 1024 - o.cy : o.cy;
  const ny = flip ? 1024 - o.node.y : o.node.y;
  const t0 = flip ? 0 : 105,
    t1 = flip ? 360 : 350;
  const pts = [];
  for (let t = t0; t <= t1; t += 1.5) {
    const r = (t * Math.PI) / 180;
    let x = o.cx + o.rx * Math.cos(r);
    let y = cyc + o.ry * Math.sin(r);
    x = o.node.x + k * (x - o.node.x);
    y = ny + k * (y - ny);
    pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return 'M' + pts.join(' L') + (flip ? ' Z' : '');
}
const outerPath = computed(() => ellipsePath(1));
const innerPath = computed(() => ellipsePath(INNER_K));
// vertically-mirrored orbit (used in the detail / no-folders state)
const outerPathFlip = computed(() => ellipsePath(1, true));
const innerPathFlip = computed(() => ellipsePath(INNER_K, true));

// up to MAX_FOLDERS spread EVENLY around the home orbit, all sharing the travel phase.
// a folder is shown ONLY while it sits on the drawn arc (105°..350°); folders rotating
// through the open bottom-right gap are hidden (and fade back in when they return).
const folderView = computed(() => {
  const n = Math.min(folderCount.value, MAX_FOLDERS),
    w = 152,
    h = 100;
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

/* ---- hover title: shows when a folder is hovered ---- */
const showLeader = computed(() => hasFolders.value && hoverIdx.value >= 0);

function onImgError(e) {
  const img = e.target;
  img.style.display = 'none';
  const ph = img.nextElementSibling;
  if (ph) ph.style.display = 'block';
}

/* ---- detail page: open a folder, lay its photos out randomly INSIDE the circle (static) ---- */
let scatterSim = null;
function buildDetail() {
  const cx = CX,
    cyF = 1024 - CY,
    rx = RX,
    ry = RY; // flipped ellipse = the circle shown here
  const n = photos.length,
    cols = 4,
    rows = Math.ceil(n / cols);
  const R = { x0: 440, x1: 1330, y0: 155, y1: 895 };
  const cellW = (R.x1 - R.x0) / cols,
    cellH = (R.y1 - R.y0) / rows;
  const cells = [];
  for (let cy = 0; cy < rows; cy++) for (let cxi = 0; cxi < cols; cxi++) cells.push([cxi, cy]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const nodes = photos.map((p, i) => {
    const [cxi, cyi] = cells[i];
    const tx = R.x0 + cellW * (cxi + 0.5) + rnd(-cellW * 0.28, cellW * 0.28);
    const ty = R.y0 + cellH * (cyi + 0.5) + rnd(-cellH * 0.28, cellH * 0.28);
    return { id: 's' + i, src: p.src, w: p.w, h: p.h, x: tx, y: ty, tx, ty };
  });
  // keep every card whole inside the ellipse + clear of the profile card
  const contain = () => {
    for (const d of nodes) {
      const rxE = rx - d.w / 2 - 6,
        ryE = ry - d.h / 2 - 6;
      const nx = (d.x - cx) / rxE,
        ny = (d.y - cyF) / ryE,
        dist = Math.hypot(nx, ny);
      if (dist > 1) {
        d.x = cx + (nx / dist) * rxE;
        d.y = cyF + (ny / dist) * ryE;
        d.vx = 0;
        d.vy = 0;
      }
      d.x = Math.max(360, Math.min(1380, d.x));
      d.y = Math.max(120, Math.min(1000, d.y));
      if (d.x - d.w / 2 < 415 && d.y - d.h / 2 < 290) d.x = 415 + d.w / 2;
    }
  };
  if (scatterSim) scatterSim.stop();
  const sim = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-12))
    .force(
      'collide',
      forceCollide()
        .radius((d) => (Math.hypot(d.w, d.h) / 2) * 0.58 + 9)
        .strength(1)
        .iterations(3)
    )
    .force('x', forceX((d) => d.tx).strength(0.2))
    .force('y', forceY((d) => d.ty).strength(0.2))
    .stop();
  for (let i = 0; i < 320; i++) {
    sim.tick();
    contain();
  } // run to completion synchronously -> static
  scatterSim = sim;
  scatter.value = nodes;
}
function openFolder(i) {
  selectedFolder.value = i;
  hasFolders.value = false;
  if (isMobile.value) buildMobileDetail();
  else buildDetail(); // desktop scatters via d3; mobile uses its own random layout
}
function goHome() {
  hasFolders.value = true;
  hoverIdx.value = -1;
  mHover.value = -1;
  dragging.value = false;
}

/* ---- mobile: drag the orbit to rotate it (find a folder); a tap (no drag) opens ---- */
function evtPoint(e) {
  const t = (e.touches && e.touches[0]) || e;
  const r = mStage.value.getBoundingClientRect();
  return { x: (t.clientX - r.left) / scale.value, y: (t.clientY - r.top) / scale.value };
}
function onDragStart(e) {
  if (!hasFolders.value) return;
  const p = evtPoint(e);
  dragging.value = true;
  didDrag = false;
  dragStart = p;
  dragLastAng = Math.atan2(p.y - M_HOME_ORBIT.cy, p.x - M_HOME_ORBIT.cx);
}
function onDragMove(e) {
  if (!dragging.value) return;
  const p = evtPoint(e);
  if (Math.hypot(p.x - dragStart.x, p.y - dragStart.y) > 6) didDrag = true;
  let ang = Math.atan2(p.y - M_HOME_ORBIT.cy, p.x - M_HOME_ORBIT.cx);
  let d = ang - dragLastAng;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  orbitPhase.value += d;
  dragLastAng = ang;
}
function onDragEnd() {
  dragging.value = false;
}
function onFolderClick(i) {
  if (didDrag) {
    didDrag = false;
    return;
  }
  openFolder(i);
}

/* ---- Three.js photo sphere (Effect A: rotating billboards) ---- */
let renderer = null,
  sphereRaf = 0;
function fibSphere(n, r) {
  const g = (1 + Math.sqrt(5)) / 2,
    pts = [];
  for (let i = 0; i < n; i++) {
    const t = Math.acos(1 - (2 * (i + 0.5)) / n),
      p = (2 * Math.PI * i) / g;
    pts.push(
      new THREE.Vector3(
        r * Math.sin(t) * Math.cos(p),
        r * Math.cos(t),
        r * Math.sin(t) * Math.sin(p)
      )
    );
  }
  return pts;
}
function makeFallbackTexture(i) {
  const w = 240,
    h = 320,
    cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  const tones = [
    ['#3c3d42', '#17181c'],
    ['#47484d', '#1d1e22'],
    ['#2f3034', '#141519'],
    ['#4a4b51', '#222329'],
    ['#36373c', '#1a1b1f']
  ];
  const [c0, c1] = tones[i % tones.length];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  const t = new THREE.CanvasTexture(cv);
  t._aspect = w / h;
  return t;
}
function initSphere() {
  const canvas = sphereCanvas.value;
  if (!canvas) return;
  const W = canvas.clientWidth || 880,
    H = canvas.clientHeight || 840;
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(W, H, false);
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 0, 5.6);
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  const positions = fibSphere(IMG_URLS.length, SPRITE_RADIUS);
  const textures = new Array(IMG_URLS.length);
  const sprites = [];
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  const build = () => {
    positions.forEach((pos, i) => {
      const tex = textures[i];
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
      );
      const a = tex._aspect || 0.75;
      sp.scale.set(0.9 * a, 0.9, 1);
      sp.position.copy(pos);
      group.add(sp);
      sprites.push(sp);
    });
    animate();
  };
  let done = 0;
  const finishOne = () => {
    if (++done >= IMG_URLS.length) build();
  };
  IMG_URLS.forEach((url, i) =>
    loader.load(
      url,
      (tex) => {
        tex._aspect = (tex.image?.naturalWidth || 3) / (tex.image?.naturalHeight || 4);
        textures[i] = tex;
        finishOne();
      },
      undefined,
      () => {
        textures[i] = makeFallbackTexture(i);
        finishOne();
      }
    )
  );

  const tmp = new THREE.Vector3();
  let t = 0;
  const animate = () => {
    sphereRaf = requestAnimationFrame(animate);
    if (!hasFolders.value) return;
    t += 0.004;
    group.rotation.y = t;
    group.rotation.x = Math.sin(t * 0.22) * 0.13;
    for (const sp of sprites) {
      sp.getWorldPosition(tmp);
      const k = Math.max(0, Math.min(1, (tmp.z + SPRITE_RADIUS) / (2 * SPRITE_RADIUS)));
      sp.material.opacity = 0.3 + 0.7 * k;
    }
    renderer.render(scene, camera);
  };
}

/* ---- orbit loop (folders travel the ellipse; hover pauses) ---- */
let orbitRaf = 0,
  orbitLast = null;
const ORBIT_SPEED = (Math.PI * 2) / 60; // one full loop ≈ 60s
function orbitLoop(ts) {
  if (orbitLast == null) orbitLast = ts;
  const dt = Math.min(0.05, (ts - orbitLast) / 1000);
  orbitLast = ts;
  if (hasFolders.value && !dragging.value && hoverIdx.value < 0 && mHover.value < 0)
    orbitPhase.value += ORBIT_SPEED * dt;
  orbitRaf = requestAnimationFrame(orbitLoop);
}

function onResize() {
  isMobile.value = window.innerWidth < 760;
  if (isMobile.value) {
    // fill viewport WIDTH; height becomes fluid in design units (keeps orbit edge-to-edge)
    scale.value = window.innerWidth / MW;
    mDesignH.value = Math.max(MH * 0.72, window.innerHeight / scale.value);
  } else {
    const containerH = parseFloat(props.height) || window.innerHeight;
    scale.value = Math.min(window.innerWidth / 1440, containerH / 1024);
  }
}

onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
  nextTick(initSphere);
  orbitRaf = requestAnimationFrame(orbitLoop);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(orbitRaf);
  cancelAnimationFrame(sphereRaf);
  if (scatterSim) scatterSim.stop();
  if (renderer) renderer.dispose();
});
</script>

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
