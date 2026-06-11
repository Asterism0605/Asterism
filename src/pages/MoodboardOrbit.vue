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
    <!-- fixed design stage, scaled to fit -->
    <div class="relative" :style="stageStyle">
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
          style="left: 410px; top: 175px; width: 880px; height: 840px; pointer-events: none"
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
            transition: 'transform .28s ease',
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

/* ---- ellipse fitted to the folder centers ---- */
const CX = 903.8,
  CY = 761.8,
  RX = 641.0,
  RY = 621.5;
const INNER_K = 0.9;
const NODE = { x: 1098, y: 170 };

/* ---- folders (base positions; theta = angle on the ellipse) ---- */
const orbitFolders = [
  { x: 672, y: 108, w: 152, h: 100 },
  { x: 1022, y: 120, w: 152, h: 100 },
  { x: 1300, y: 325, w: 152, h: 100 },
  { x: 373, y: 270, w: 150, h: 100 },
  { x: 215, y: 520, w: 152, h: 103 },
  { x: 190, y: 818, w: 152, h: 105 }
];
orbitFolders.forEach((f) => {
  const cx = f.x + f.w / 2,
    cy = f.y + f.h / 2;
  f.theta = Math.atan2((cy - CY) / RY, (cx - CX) / RX);
});

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

/* ---- derived ---- */
const stageStyle = computed(() => ({
  width: '1440px',
  height: '1024px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
  flex: '0 0 auto'
}));

function ellipsePath(k, flip) {
  const cyc = flip ? 1024 - CY : CY;
  const ny = flip ? 1024 - NODE.y : NODE.y;
  const pts = [];
  for (let t = 0; t <= 360; t += 1.5) {
    const r = (t * Math.PI) / 180;
    let x = CX + RX * Math.cos(r);
    let y = cyc + RY * Math.sin(r);
    x = NODE.x + k * (x - NODE.x);
    y = ny + k * (y - ny);
    pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return 'M' + pts.join(' L') + ' Z';
}
const outerPath = computed(() => ellipsePath(1));
const innerPath = computed(() => ellipsePath(INNER_K));
// vertically-mirrored orbit (used in the detail / no-folders state)
const outerPathFlip = computed(() => ellipsePath(1, true));
const innerPathFlip = computed(() => ellipsePath(INNER_K, true));

const folderView = computed(() =>
  orbitFolders.map((f, i) => {
    const ang = f.theta + orbitPhase.value;
    const cx = CX + RX * Math.cos(ang);
    const cy = CY + RY * Math.sin(ang);
    return {
      i,
      w: f.w,
      h: f.h,
      active: hoverIdx.value === i,
      left: cx - f.w / 2 - 10,
      top: cy - f.h / 2 - 30
    };
  })
);

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
  buildDetail();
}
function goHome() {
  hasFolders.value = true;
  hoverIdx.value = -1;
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
  if (hasFolders.value && hoverIdx.value < 0) orbitPhase.value += ORBIT_SPEED * dt;
  orbitRaf = requestAnimationFrame(orbitLoop);
}

function onResize() {
  const containerH = parseFloat(props.height) || window.innerHeight;
  scale.value = Math.min(window.innerWidth / 1440, containerH / 1024);
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
</style>
