# MoodboardOrbit 模組拆分設計

**日期：** 2026-06-13  
**分支：** Moodboard  
**目標：** 將單一 `src/pages/MoodboardOrbit.vue`（1319 行）拆分為資料夾模組，依性質分離 UI、動畫、計算邏輯，與 `FloatingImageNetwork/` 維持相同架構風格。

---

## 背景

組長要求：目前整個 UI、動畫效果、計算邏輯都包在一個 Vue 檔案內，需依性質或功能拆分。參考標準：`src/components/sections/FloatingImageNetwork/`。

決策：
- 只拆 `<script>` 邏輯，`<template>` 和 `<style scoped>` 維持在同一個 `.vue` 檔。
- 採用「純 TS 模組為主，單一 composable 處理手機拖曳」的中間路線（方案 C）。

---

## 目標檔案結構

```
src/pages/MoodboardOrbit/
├── config.ts           ← 常數、靜態資料
├── layout.ts           ← 純函式：幾何算法 + photo packer
├── sphere.ts           ← Three.js 邏輯
├── useMobileOrbit.ts   ← Vue composable：手機拖曳
├── MoodboardOrbit.vue  ← 主元件（reactive state + orbit loop + 導航 + template）
└── index.ts            ← re-export，讓外部 import 路徑不變
```

---

## 各檔詳細規格

### `config.ts`
**職責：** 所有常數與靜態資料，零 Vue 依賴。

匯出內容：
- `NAV_H = 64`
- `INNER_K = 0.9`
- `ORBIT_SPEED = (Math.PI * 2) / 60`
- `SPRITE_RADIUS = 2.2`
- `MAX_FOLDERS = 10`
- `DETAIL_CAP = 20`
- `HO` — 桌面 orbit 橢圓參數 `{ cx, cy, rx, ry, node }`
- `MW = 440`, `MH = 956`
- `M_HOME_ORBIT`, `M_DETAIL_ORBIT` — 手機 orbit 橢圓參數
- `folderNames: string[]` — demo 資料夾名稱陣列（10 筆）
- `photos: { src, w, h }[]` — demo 照片陣列（20 筆）
- `IMG_URLS: string[]` — 從 photos 衍生的 src 陣列
- `mDetailBase: { src, w, h }[]` — 手機 detail 照片陣列（10 筆）
- `mHomePhotos` — 手機 home 靜態照片位置陣列（6 筆）

**限制：** 不 import Vue、不 import Three.js。

---

### `layout.ts`
**職責：** 純函式，無副作用，不碰 Vue reactivity，不碰 DOM。

匯出函式：

```ts
packPhotos(list: PhotoItem[], opt: PackOptions): PackNode[]
```
- 現有 packPhotos 邏輯完整移入（約 185 行）
- 輸入：照片陣列 + 橢圓/邊界/障礙物參數
- 輸出：含 `{ id, src, w, h, x, y, delay, faded }` 的節點陣列

```ts
ellipsePath(k: number): string
```
- 桌面橢圓 SVG path（使用 `HO` 參數，arc 105°→350°）

```ts
ellipsePathM(orbit: OrbitParams, k: number): string
```
- 手機橢圓 SVG path（完整 360°）

```ts
fibSphere(n: number, r: number): THREE.Vector3[]
```
- Fibonacci 球面均勻分佈點，回傳 `THREE.Vector3[]`
- 此函式依賴 Three.js，但無 DOM/Vue 依賴，放在 layout.ts 合理

**限制：** 不 import Vue。允許 import Three.js（僅 Vector3）。

---

### `sphere.ts`
**職責：** Three.js WebGL 球體的初始化、動畫、resize、dispose。不引入 Vue。

匯出函式：

```ts
export function initSphere(
  canvas: HTMLCanvasElement,
  getScale: () => number,
  getHasFolders: () => boolean
): { resize: () => void; dispose: () => void }
```

- 內部負責：建立 renderer / camera / scene / group
- 呼叫 `fibSphere`（從 layout.ts import）產生球面點
- 載入貼圖（TextureLoader），失敗時用 `makeFallbackTexture`
- 啟動 `requestAnimationFrame` 動畫 loop
- `resize()` — 同步 canvas 尺寸、pixel ratio、camera aspect
- `dispose()` — 取消 RAF、dispose renderer
- `makeFallbackTexture` 為模組內部 private 函式（不匯出）
- `sphereDPR` 為模組內部 private 函式（不匯出）

**限制：** 不 import Vue。`hasFolders` 以 getter 函式傳入，不使用 Vue ref。

---

### `useMobileOrbit.ts`
**職責：** 手機拖曳互動邏輯（`onDragStart/Move/End`、`evtPoint`），回傳事件處理函式與響應式狀態。

```ts
export function useMobileOrbit(
  mStageRef: Ref<HTMLElement | null>,
  scaleRef: Ref<number>,
  orbitPhaseRef: Ref<number>
) {
  const mHover = ref(-1)
  const dragging = ref(false)
  // 內部：didDrag, dragStart, dragLastAng (非響應式，純 let 變數)

  function onDragStart(e: PointerEvent): void
  function onDragMove(e: PointerEvent): void
  function onDragEnd(): void
  function onFolderClick(i: number, openFolder: (i: number) => void): void

  return { mHover, dragging, onDragStart, onDragMove, onDragEnd, onFolderClick }
}
```

- `orbitPhaseRef` 從主元件傳入（桌面 orbit loop 也使用同一個 ref，共用旋轉狀態）
- `onFolderClick` 接受一個 callback，讓主元件決定 openFolder 行為

**限制：** 只 import Vue（ref、Ref）。不 import Three.js。

---

### `MoodboardOrbit.vue`
**職責：** 主元件，協調所有響應式狀態，持有 template 和 style。

`<script setup>` 保留：
- `import` 所有上面抽出的模組
- Reactive state：`scale`, `hasFolders`, `orbitPhase`, `hoverIdx`, `selectedFolder`, `scatter`, `sphereCanvas`, `isMobile`, `deskVisibleH`, `mDetailPhotos`, `mStage`, `mDesignH`
- Computed：`selectedName`, `stageStyle`, `sphereStyle`, `mStageStyle`, `outerPath`, `innerPath`, `folderView`, `showLeader`, `mFolders`, `mOrbitOuter`, `mOrbitInner`, `mPhotoView`, `deskBackTop`, `deskTabTop`
- 使用 `useMobileOrbit` composable
- `buildDetail()`, `buildMobileDetail()`（呼叫 `packPhotos` from layout.ts）
- `openFolder()`, `goHome()`, `slugFor()`, `navigate()`, `onPopState()`
- `orbitLoop()` — 使用 `requestAnimationFrame`，更新 `orbitPhase`
- `onResize()`, `onImgError()`
- `onMounted`：呼叫 `initSphere`（存回 `{ resize, dispose }`）、啟動 orbit RAF、綁定事件
- `onBeforeUnmount`：取消 RAF、呼叫 `dispose()`、解除事件

`<template>`：**完全不動**（整段直接搬入，不重構任何 HTML）  
`<style scoped>`：**完全不動**

---

### `index.ts`
**職責：** 維持向外的 import 路徑相容性。

```ts
export { default } from './MoodboardOrbit.vue'
```

---

## 資料流總覽

```
config.ts ──→ layout.ts (packPhotos, ellipsePath, fibSphere)
config.ts ──→ sphere.ts (initSphere)
config.ts ──→ MoodboardOrbit.vue (constants)
layout.ts ──→ MoodboardOrbit.vue (buildDetail, buildMobileDetail, outerPath, innerPath, mOrbit*)
sphere.ts ──→ MoodboardOrbit.vue (initSphere → { resize, dispose })
useMobileOrbit.ts ──→ MoodboardOrbit.vue (mHover, dragging, drag handlers)
```

---

## 不在此次範圍內

- 修改 `<template>` 或 `<style>`
- 拆分子元件（MoodboardOrbitDesktop / MoodboardOrbitMobile）
- 重構 props / emits 介面
- 加入 TypeScript（目前 .vue 為 JS，config.ts / layout.ts / sphere.ts 以 TS 撰寫）
- 任何功能新增或 bug fix

---

## 成功標準

1. `src/pages/MoodboardOrbit.vue` 可改為 `src/pages/MoodboardOrbit/MoodboardOrbit.vue`，外部 router import 透過 `index.ts` 無縫接上。
2. 畫面行為與原版完全一致（桌面/手機、home/detail、hover/drag 均正常）。
3. 各 `.ts` 檔可獨立閱讀，無需追蹤 Vue template 才能理解邏輯。
