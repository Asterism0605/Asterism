# MoodboardOrbit 模組拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 `src/pages/MoodboardOrbit.vue`（1319 行）移至 `src/pages/MoodboardOrbit/` 資料夾，依性質拆分為四個模組，主元件 `<template>` 與 `<style>` 完全不動。

**Architecture:** 純程式碼搬移，零邏輯改動。`config.ts` 放靜態資料、`layout.ts` 放純函式、`sphere.ts` 封裝 Three.js 生命週期、`useMobileOrbit.ts` 封裝手機拖曳 composable。主元件透過 import 串接各模組。

**Tech Stack:** Vue 3 (script setup, JS), TypeScript (.ts 模組), Three.js, Vitest

---

## Files

| 動作 | 路徑 |
|------|------|
| Create | `src/pages/MoodboardOrbit/config.ts` |
| Create | `src/pages/MoodboardOrbit/layout.ts` |
| Create | `src/pages/MoodboardOrbit/sphere.ts` |
| Create | `src/pages/MoodboardOrbit/useMobileOrbit.ts` |
| Create | `src/pages/MoodboardOrbit/MoodboardOrbit.vue` |
| Create | `src/pages/MoodboardOrbit/index.ts` |
| Delete | `src/pages/MoodboardOrbit.vue` |
| Modify | `src/router/index.ts:4` |

---

### Task 1: 確認測試基準線

**Files:**
- Read: `src/tests/router.spec.ts`

- [ ] **Step 1: 執行現有測試，記錄目前結果**

```bash
npm run test -- --run
```

Expected：測試執行完畢（router.spec.ts 中有一個路由名稱不符的既有失敗，記錄但不修，不在本次範圍）。

- [ ] **Step 2: 提交空基準 commit**

```bash
git commit --allow-empty -m "chore: baseline before MoodboardOrbit refactor"
```

---

### Task 2: 建立 `config.ts`

**Files:**
- Create: `src/pages/MoodboardOrbit/config.ts`

- [ ] **Step 1: 建立檔案，寫入所有常數與靜態資料**

```ts
// src/pages/MoodboardOrbit/config.ts

export const NAV_H = 64
export const INNER_K = 0.9
export const ORBIT_SPEED = (Math.PI * 2) / 60
export const SPRITE_RADIUS = 2.2
export const MAX_FOLDERS = 10
export const DETAIL_CAP = 20

export const HO = { cx: 980, cy: 550, rx: 500, ry: 500, node: { x: 1350, y: 40 } }

export const MW = 440
export const MH = 956

export const M_HOME_ORBIT = { cx: 220, cy: 831, rx: 597, ry: 597, node: { x: 470, y: 230 } }
export const M_DETAIL_ORBIT = { cx: 220, cy: 831, rx: 597, ry: 597, node: { x: 470, y: 230 } }

export const folderNames: string[] = [
  'Project Title', 'Editorial 02', 'Texture Study', 'Runway SS', 'Interiors',
  'Palette', 'Archive', 'Studio Day', 'Lookbook', 'Muse'
]

export interface PhotoItem {
  src: string
  w: number
  h: number
  faded?: boolean
}

export const photos: PhotoItem[] = [
  { src: '/images/image1.png', w: 120, h: 96 },
  { src: '/images/image2.png', w: 112, h: 150 },
  { src: '/images/image3.png', w: 100, h: 140 },
  { src: '/images/image4.png', w: 132, h: 100 },
  { src: '/images/image5.png', w: 150, h: 150 },
  { src: '/images/image1.png', w: 110, h: 130 },
  { src: '/images/image2.png', w: 140, h: 108 },
  { src: '/images/image3.png', w: 118, h: 148 },
  { src: '/images/image4.png', w: 148, h: 112 },
  { src: '/images/image5.png', w: 104, h: 138 },
  { src: '/images/image1.png', w: 128, h: 100 },
  { src: '/images/image2.png', w: 114, h: 146 },
  { src: '/images/image3.png', w: 142, h: 110 },
  { src: '/images/image4.png', w: 100, h: 128 },
  { src: '/images/image5.png', w: 148, h: 130 },
  { src: '/images/image1.png', w: 112, h: 142 },
  { src: '/images/image2.png', w: 134, h: 100 },
  { src: '/images/image3.png', w: 98, h: 138 },
  { src: '/images/image4.png', w: 146, h: 116 },
  { src: '/images/image5.png', w: 120, h: 148 }
]

export const IMG_URLS: string[] = photos.map(p => p.src)

const mImg = (n: number) => `/images/image${n}.png`

export const mDetailBase: PhotoItem[] = [
  { src: mImg(4), w: 58, h: 66 },
  { src: mImg(5), w: 116, h: 136 },
  { src: mImg(3), w: 48, h: 74 },
  { src: mImg(2), w: 84, h: 104 },
  { src: mImg(3), w: 50, h: 78 },
  { src: mImg(1), w: 66, h: 72 },
  { src: mImg(5), w: 104, h: 92 },
  { src: mImg(2), w: 74, h: 92 },
  { src: mImg(4), w: 62, h: 56 },
  { src: mImg(1), w: 70, h: 84 }
]

export interface HomePhoto {
  id: string
  src: string
  cx: number
  cy: number
  w: number
  h: number
  faded?: boolean
}

export const mHomePhotos: HomePhoto[] = [
  { id: 'h0', src: mImg(4), cx: 140, cy: 447, w: 52, h: 52 },
  { id: 'h1', src: mImg(5), cx: 313, cy: 517, w: 108, h: 130 },
  { id: 'h2', src: mImg(2), cx: 80, cy: 614, w: 80, h: 96 },
  { id: 'h3', src: mImg(3), cx: 217, cy: 656, w: 44, h: 52, faded: true },
  { id: 'h4', src: mImg(1), cx: 128, cy: 785, w: 58, h: 64 },
  { id: 'h5', src: mImg(5), cx: 294, cy: 853, w: 104, h: 96 }
]
```

- [ ] **Step 2: commit**

```bash
git add src/pages/MoodboardOrbit/config.ts
git commit -m "refactor(moodboard): 新增 config.ts — 常數與靜態資料"
```

---

### Task 3: 建立 `layout.ts`

**Files:**
- Create: `src/pages/MoodboardOrbit/layout.ts`

原始函式位置（`src/pages/MoodboardOrbit.vue`）：
- `packPhotos`：line 646–827
- `ellipsePathM`：line 848–859
- `ellipsePath`：line 935–950
- `fibSphere`：line 1119–1133

- [ ] **Step 1: 建立檔案，貼入型別定義與四個函式**

```ts
// src/pages/MoodboardOrbit/layout.ts
import * as THREE from 'three'
import { HO } from './config'
import type { PhotoItem } from './config'

export interface Obstacle {
  x0: number; x1: number; y0: number; y1: number
}

export interface PackOptions {
  cx: number; cy: number; rx: number; ry: number
  gap?: number
  xMin?: number; xMax?: number; yMin?: number; yMax?: number
  obstacles?: Obstacle[]
  fillRatio?: number
  idPrefix?: string
}

export interface PackNode {
  id: string; src: string; w: number; h: number
  faded?: boolean; delay: string; x: number; y: number
}

export interface OrbitParams {
  cx: number; cy: number; rx: number; ry: number
  node: { x: number; y: number }
}
```

接著貼入 `packPhotos`（從原始檔 line 646 複製到 line 827，加上 `export` 關鍵字，函式簽名改為以下型別）：

```ts
export function packPhotos(list: PhotoItem[], opt: PackOptions): PackNode[] {
  // 從原始 MoodboardOrbit.vue line 647 完整複製到 line 827，內容不變
}
```

接著貼入 `ellipsePathM`（從原始檔 line 848 複製到 line 859，加 `export`，參數 `o` 改用 `OrbitParams` 型別）：

```ts
export function ellipsePathM(o: OrbitParams, k: number): string {
  // 從原始 MoodboardOrbit.vue line 849 完整複製到 line 859，內容不變
}
```

接著貼入 `ellipsePath`（從原始檔 line 935 複製到 line 950，加 `export`，函式內部使用 import 來的 `HO`，不需要 local const）：

```ts
export function ellipsePath(k: number): string {
  const o = HO
  // 從原始 MoodboardOrbit.vue line 937 完整複製到 line 950，內容不變
}
```

接著貼入 `fibSphere`（從原始檔 line 1119 複製到 line 1133，加 `export`）：

```ts
export function fibSphere(n: number, r: number): THREE.Vector3[] {
  // 從原始 MoodboardOrbit.vue line 1120 完整複製到 line 1133，內容不變
}
```

- [ ] **Step 2: commit**

```bash
git add src/pages/MoodboardOrbit/layout.ts
git commit -m "refactor(moodboard): 新增 layout.ts — 純幾何算法與 photo packer"
```

---

### Task 4: 建立 `sphere.ts`

**Files:**
- Create: `src/pages/MoodboardOrbit/sphere.ts`

原始函式位置：
- `sphereDPR`：line 1104–1106（轉為 private）
- `resizeSphere`：line 1108–1118（轉為回傳的 `resize()` 方法）
- `makeFallbackTexture`：line 1135–1161（private）
- `initSphere` 主體：line 1162–1242（改為接受 getters，回傳 `SphereHandle`）

- [ ] **Step 1: 建立檔案，寫入 Three.js 邏輯**

```ts
// src/pages/MoodboardOrbit/sphere.ts
import * as THREE from 'three'
import { fibSphere } from './layout'
import { IMG_URLS, SPRITE_RADIUS } from './config'

export interface SphereHandle {
  resize: () => void
  dispose: () => void
}

export function initSphere(
  canvas: HTMLCanvasElement,
  getScale: () => number,
  getHasFolders: () => boolean
): SphereHandle {
  // sphereDPR 轉為 closure（原始 line 1104–1106，getScale() 取代 scale.value）
  function sphereDPR() {
    return Math.min((window.devicePixelRatio || 1) * Math.max(1, getScale()), 3)
  }

  // renderer 初始化（原始 line 1166–1178）
  const W = canvas.clientWidth || 880
  const H = canvas.clientHeight || 840
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(sphereDPR())
  renderer.setClearColor(0x000000, 0)
  renderer.setSize(W, H, false)
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
  camera.position.set(0, 0, 7)
  const scene = new THREE.Scene()
  const group = new THREE.Group()
  scene.add(group)

  // makeFallbackTexture（原始 line 1135–1161，邏輯完全不變）
  function makeFallbackTexture(i: number) {
    const w = 240, h = 320, cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    const ctx = cv.getContext('2d')!
    const tones: [string, string][] = [
      ['#3c3d42', '#17181c'], ['#47484d', '#1d1e22'],
      ['#2f3034', '#141519'], ['#4a4b51', '#222329'], ['#36373c', '#1a1b1f']
    ]
    const [c0, c1] = tones[i % tones.length]
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, c0); g.addColorStop(1, c1)
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2
    ctx.strokeRect(1, 1, w - 2, h - 2)
    const t = new THREE.CanvasTexture(cv)
    ;(t as any)._aspect = w / h
    return t
  }

  const positions = fibSphere(IMG_URLS.length, SPRITE_RADIUS)
  const textures: THREE.Texture[] = new Array(IMG_URLS.length)
  const sprites: THREE.Sprite[] = []
  const loader = new THREE.TextureLoader()
  loader.crossOrigin = 'anonymous'
  let rafId = 0

  // build sprites + start animate（原始 line 1186–1241）
  function build() {
    positions.forEach((pos, i) => {
      const tex = textures[i]
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
      )
      const a = (tex as any)._aspect || 0.75
      sp.scale.set(0.9 * a, 0.9, 1)
      sp.position.copy(pos)
      group.add(sp)
      sprites.push(sp)
    })
    animate()
  }

  let done = 0
  const finishOne = () => { if (++done >= IMG_URLS.length) build() }

  IMG_URLS.forEach((url, i) =>
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        tex.minFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        ;(tex as any)._aspect = (tex.image?.naturalWidth || 3) / (tex.image?.naturalHeight || 4)
        textures[i] = tex
        finishOne()
      },
      undefined,
      () => { textures[i] = makeFallbackTexture(i); finishOne() }
    )
  )

  const tmp = new THREE.Vector3()
  let t = 0
  function animate() {
    rafId = requestAnimationFrame(animate)
    if (!getHasFolders()) return
    t += 0.004
    group.rotation.y = t
    group.rotation.x = Math.sin(t * 0.22) * 0.13
    for (const sp of sprites) {
      sp.getWorldPosition(tmp)
      const k = Math.max(0, Math.min(1, (tmp.z + SPRITE_RADIUS) / (2 * SPRITE_RADIUS)))
      sp.material.opacity = 0.55 + 0.45 * k
    }
    renderer.render(scene, camera)
  }

  // resize（原始 resizeSphere，line 1108–1118，getScale() 取代 scale.value）
  function resize() {
    const W2 = canvas.clientWidth, H2 = canvas.clientHeight
    if (!W2 || !H2) return
    renderer.setPixelRatio(sphereDPR())
    renderer.setSize(W2, H2, false)
    camera.aspect = W2 / H2
    camera.updateProjectionMatrix()
  }

  function dispose() {
    cancelAnimationFrame(rafId)
    renderer.dispose()
  }

  return { resize, dispose }
}
```

- [ ] **Step 2: commit**

```bash
git add src/pages/MoodboardOrbit/sphere.ts
git commit -m "refactor(moodboard): 新增 sphere.ts — Three.js 球體邏輯"
```

---

### Task 5: 建立 `useMobileOrbit.ts`

**Files:**
- Create: `src/pages/MoodboardOrbit/useMobileOrbit.ts`

原始函式位置：`evtPoint` line 1062, `onDragStart` line 1067, `onDragMove` line 1075, `onDragEnd` line 1086, `onFolderClick` line 1089。

注意：`consumeDidDrag()` 取代原本 `onFolderClick` 裡的 `didDrag` 判斷，讓主元件自己定義 `onFolderClick`，不需修改 template。`hasFoldersRef` 傳入以保留原始 `if (!hasFolders.value) return` 的防護。

- [ ] **Step 1: 建立 composable**

```ts
// src/pages/MoodboardOrbit/useMobileOrbit.ts
import { ref, type Ref } from 'vue'
import { M_HOME_ORBIT } from './config'

export function useMobileOrbit(
  mStageRef: Ref<HTMLElement | null>,
  scaleRef: Ref<number>,
  orbitPhaseRef: Ref<number>,
  hasFoldersRef: Ref<boolean>
) {
  const mHover = ref(-1)
  const dragging = ref(false)
  let didDrag = false
  let dragStart: { x: number; y: number } | null = null
  let dragLastAng = 0

  function evtPoint(e: PointerEvent) {
    const t = ((e as any).touches?.[0]) || e
    const r = mStageRef.value!.getBoundingClientRect()
    return {
      x: (t.clientX - r.left) / scaleRef.value,
      y: (t.clientY - r.top) / scaleRef.value
    }
  }

  function onDragStart(e: PointerEvent) {
    if (!hasFoldersRef.value) return
    const p = evtPoint(e)
    dragging.value = true
    didDrag = false
    dragStart = p
    dragLastAng = Math.atan2(p.y - M_HOME_ORBIT.cy, p.x - M_HOME_ORBIT.cx)
  }

  function onDragMove(e: PointerEvent) {
    if (!dragging.value) return
    const p = evtPoint(e)
    if (Math.hypot(p.x - dragStart!.x, p.y - dragStart!.y) > 6) didDrag = true
    let ang = Math.atan2(p.y - M_HOME_ORBIT.cy, p.x - M_HOME_ORBIT.cx)
    let d = ang - dragLastAng
    if (d > Math.PI) d -= 2 * Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    orbitPhaseRef.value += d
    dragLastAng = ang
  }

  function onDragEnd() {
    dragging.value = false
  }

  function consumeDidDrag(): boolean {
    if (didDrag) { didDrag = false; return true }
    return false
  }

  return { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag }
}
```

- [ ] **Step 2: commit**

```bash
git add src/pages/MoodboardOrbit/useMobileOrbit.ts
git commit -m "refactor(moodboard): 新增 useMobileOrbit.ts — 手機拖曳 composable"
```

---

### Task 6: 建立新的 `MoodboardOrbit.vue`

**Files:**
- Create: `src/pages/MoodboardOrbit/MoodboardOrbit.vue`

- [ ] **Step 1: 建立檔案**

`<template>` 從原始檔 **line 22–517** 完整複製，一字不改。  
`<style scoped>` 從原始檔 **line 1292–1318** 完整複製，一字不改。  
`<script setup>` 替換為下方新版（ProfileCard 路徑改為 `../../components/ui/ProfileCard.vue`）：

```vue
<template>
  <!-- 從原始 src/pages/MoodboardOrbit.vue line 22–517 完整複製 -->
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ProfileCard from '../../components/ui/ProfileCard.vue'
import {
  NAV_H, INNER_K, ORBIT_SPEED, MAX_FOLDERS, DETAIL_CAP,
  HO, MW, MH, M_HOME_ORBIT, M_DETAIL_ORBIT,
  folderNames, photos, mDetailBase, mHomePhotos
} from './config'
import { packPhotos, ellipsePath, ellipsePathM } from './layout'
import { initSphere } from './sphere'
import { useMobileOrbit } from './useMobileOrbit'

const props = defineProps({
  height: { type: String, default: '100vh' },
  folders: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  basePath: { type: String, default: '/moodboard' }
})
const emit = defineEmits(['open', 'home'])

const folderCount = ref(10)

/* ---- reactive state ---- */
const scale = ref(1)
const hasFolders = ref(true)
const orbitPhase = ref(0)
const hoverIdx = ref(-1)
const selectedFolder = ref(0)
const selectedName = computed(() => folderNames[selectedFolder.value % folderNames.length])
const scatter = ref([])
const sphereCanvas = ref(null)
const isMobile = ref(false)
const deskVisibleH = ref(1024)
const deskBackTop = computed(() => Math.round(deskVisibleH.value - 130))
const deskTabTop = computed(() => Math.round(deskVisibleH.value - 96))
const mStage = ref(null)
const mDesignH = ref(MH)
const mDetailPhotos = ref([])

const { mHover, dragging, onDragStart, onDragMove, onDragEnd, consumeDidDrag } =
  useMobileOrbit(mStage, scale, orbitPhase, hasFolders)

/* ---- derived ---- */
const stageStyle = computed(() => ({
  position: 'absolute', top: '0', left: '0',
  width: '1440px', height: '1024px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}))

const sphereStyle = computed(() => {
  const vh = deskVisibleH.value
  const size = Math.min(860, Math.max(440, vh - 70))
  const top = Math.max(36, (vh - size) / 2 + 50)
  const left = Math.round(1000 - size / 2)
  return {
    position: 'absolute',
    left: left + 'px',
    top: Math.round(top) + 'px',
    width: size + 'px',
    height: size + 'px',
    pointerEvents: 'none'
  }
})

const mStageStyle = computed(() => ({
  position: 'absolute', left: '0', top: '0',
  width: MW + 'px', height: mDesignH.value + 'px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}))

const mOrbitOuter = computed(() =>
  ellipsePathM(hasFolders.value ? M_HOME_ORBIT : M_DETAIL_ORBIT, 1)
)
const mOrbitInner = computed(() =>
  ellipsePathM(hasFolders.value ? M_HOME_ORBIT : M_DETAIL_ORBIT, 0.9)
)

const mFolders = computed(() => {
  const o = M_HOME_ORBIT, n = Math.min(folderCount.value, MAX_FOLDERS), w = 86, h = 66
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + orbitPhase.value
    return { i, cx: o.cx + o.rx * Math.cos(ang), cy: o.cy + o.ry * Math.sin(ang), w, h }
  })
})

const mPhotoView = computed(() => {
  if (hasFolders.value) return mHomePhotos.map((p, i) => ({ ...p, delay: (i * 0.06).toFixed(2) }))
  return mDetailPhotos.value
})

const outerPath = computed(() => ellipsePath(1))
const innerPath = computed(() => ellipsePath(INNER_K))

const folderView = computed(() => {
  const n = Math.min(folderCount.value, MAX_FOLDERS), w = 110, h = 60
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + orbitPhase.value
    const cx = HO.cx + HO.rx * Math.cos(ang)
    const cy = HO.cy + HO.ry * Math.sin(ang)
    const deg = ((((ang * 180) / Math.PI) % 360) + 360) % 360
    const onLine = deg >= 105 && deg <= 350
    return { i, w, h, active: hoverIdx.value === i, onLine, left: cx - w / 2 - 10, top: cy - h / 2 - 30 }
  })
})

const showLeader = computed(() => hasFolders.value && hoverIdx.value >= 0)

function onImgError(e) {
  const img = e.target
  img.style.display = 'none'
  const ph = img.nextElementSibling
  if (ph) ph.style.display = 'block'
}

function buildDetail() {
  const o = HO
  const floor = deskVisibleH.value
  const list = photos.slice(0, DETAIL_CAP)
  const nodes = packPhotos(list, {
    idPrefix: 's', cx: o.cx, cy: o.cy, rx: o.rx, ry: o.ry,
    gap: 14, xMin: 18, xMax: 1422, yMin: 234, yMax: floor - 116,
    obstacles: [
      { x0: -100, x1: 412, y0: -100, y1: 300 },
      { x0: -100, x1: 360, y0: floor - 100, y1: floor + 100 }
    ]
  })
  scatter.value = nodes.map(d => ({ id: d.id, src: d.src, w: d.w, h: d.h, delay: d.delay, x: d.x, y: d.y }))
}

function buildMobileDetail() {
  const o = M_DETAIL_ORBIT
  const photoFloorBottom = mDesignH.value - 138
  const nodes = packPhotos(mDetailBase, {
    idPrefix: 'md', cx: o.cx, cy: o.cy, rx: o.rx, ry: o.ry,
    gap: 10, xMin: 16, xMax: 424, yMin: 196, yMax: photoFloorBottom
  })
  mDetailPhotos.value = nodes.map(d => ({
    id: d.id, src: d.src, w: d.w, h: d.h, faded: d.faded, delay: d.delay, cx: d.x, cy: d.y
  }))
}

function openFolder(i) {
  selectedFolder.value = i
  hasFolders.value = false
  if (isMobile.value) buildMobileDetail()
  else buildDetail()
  navigate(slugFor(i), i)
}

function slugFor(i) {
  const name = folderNames[i % folderNames.length] || 'folder-' + i
  return encodeURIComponent(name.trim().replace(/\s+/g, '-').toLowerCase())
}

function navigate(slug, i) {
  const path = props.basePath + (slug ? '/' + slug : '')
  try { window.history.pushState({ slug }, '', path) } catch (e) { /* ignore */ }
  if (slug) emit('open', { index: i, name: folderNames[i % folderNames.length], slug, path })
  else emit('home', { path })
}

function goHome() {
  hasFolders.value = true
  hoverIdx.value = -1
  mHover.value = -1
  dragging.value = false
  navigate('', -1)
}

function onPopState() {
  const m = (window.location.pathname || '').match(
    new RegExp(props.basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/(.+)$')
  )
  if (!m && !hasFolders.value) {
    hasFolders.value = true
    hoverIdx.value = -1
    mHover.value = -1
  }
}

function onFolderClick(i) {
  if (consumeDidDrag()) return
  openFolder(i)
}

let sphereHandle = null
let orbitRaf = 0, orbitLast = null

function orbitLoop(ts) {
  if (orbitLast == null) orbitLast = ts
  const dt = Math.min(0.05, (ts - orbitLast) / 1000)
  orbitLast = ts
  if (hasFolders.value && !dragging.value && hoverIdx.value < 0 && mHover.value < 0)
    orbitPhase.value += ORBIT_SPEED * dt
  orbitRaf = requestAnimationFrame(orbitLoop)
}

function onResize() {
  isMobile.value = window.innerWidth < 760
  const viewH = window.innerHeight - NAV_H
  if (isMobile.value) {
    scale.value = window.innerWidth / MW
    mDesignH.value = Math.max(MH * 0.72, viewH / scale.value)
  } else {
    scale.value = window.innerWidth / 1440
    deskVisibleH.value = Math.min(1024, viewH / scale.value)
    nextTick(() => sphereHandle && sphereHandle.resize())
  }
  if (!hasFolders.value) {
    if (isMobile.value) buildMobileDetail()
    else buildDetail()
  }
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  nextTick(() => {
    if (sphereCanvas.value) {
      sphereHandle = initSphere(sphereCanvas.value, () => scale.value, () => hasFolders.value)
    }
  })
  orbitRaf = requestAnimationFrame(orbitLoop)
  window.addEventListener('popstate', onPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('popstate', onPopState)
  cancelAnimationFrame(orbitRaf)
  if (sphereHandle) sphereHandle.dispose()
})
</script>

<style scoped>
  <!-- 從原始 src/pages/MoodboardOrbit.vue line 1292–1318 完整複製 -->
</style>
```

- [ ] **Step 2: commit**

```bash
git add src/pages/MoodboardOrbit/MoodboardOrbit.vue
git commit -m "refactor(moodboard): 新增拆分後主元件（script 更新，template/style 不變）"
```

---

### Task 7: 建立 `index.ts`，更新 router，刪除舊檔

**Files:**
- Create: `src/pages/MoodboardOrbit/index.ts`
- Modify: `src/router/index.ts:4`
- Delete: `src/pages/MoodboardOrbit.vue`

- [ ] **Step 1: 建立 `index.ts`**

```ts
// src/pages/MoodboardOrbit/index.ts
export { default } from './MoodboardOrbit.vue'
```

- [ ] **Step 2: 更新 router import（line 4）**

將 `src/router/index.ts` 第 4 行由：
```ts
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
```
改為：
```ts
import MoodboardOrbit from '@/pages/MoodboardOrbit';
```
（移除 `.vue`，Vite 透過資料夾的 `index.ts` 解析）

- [ ] **Step 3: 刪除舊檔**

```bash
git rm src/pages/MoodboardOrbit.vue
```

- [ ] **Step 4: commit**

```bash
git add src/pages/MoodboardOrbit/index.ts src/router/index.ts
git commit -m "refactor(moodboard): 完成模組拆分 — 建立 index.ts、更新 router、移除舊檔"
```

---

### Task 8: 驗證

- [ ] **Step 1: 執行測試**

```bash
npm run test -- --run
```

Expected：與 Task 1 結果相同（既有失敗數不增加）。

- [ ] **Step 2: 啟動 dev server 手動驗證**

```bash
npm run dev
```

開啟 `http://localhost:5173/moodboard`，逐項確認：

| 情境 | 預期行為 |
|------|----------|
| 桌面首頁 | 球體旋轉、folder 沿橢圓移動、hover 顯示名稱 |
| 桌面 detail | 點擊 folder → 照片散佈圓內、Back 按鈕回 home |
| 手機首頁（375px） | folder 出現、拖曳旋轉軌道 |
| 手機 detail | tap folder → 照片顯示、Back 回 home |
| 視窗縮放 | 不崩潰、layout 自動調整 |

- [ ] **Step 3: 若有修正，commit**

```bash
git add -A
git commit -m "fix(moodboard): 驗證後的小修正（如有）"
```
