# Issue #44 首頁圖片分佈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首頁顯示全部 45 張概念照（9 組 × 5），以「每 100vh 約 5 張」的密度往下鋪、總高 900vh，避免空白螢幕與擠中間。

**Architecture:** 把 develop 的新 `style-data.json`（223 筆）與 WebP 圖檔精準 checkout 進本分支；`getHomeInspirationImages` 維持 `!medium` 篩選（自動圈出 45 張）；放開 `FloatingImageNetwork` 的數量上限；首頁容器高度依密度算成 900vh；layout 改成「依索引均勻分帶的初始 y + 弱化 y 向心力」。

**Tech Stack:** Vue 3 `<script setup>`、d3-force、Vitest、vue-tsc。

設計文件：`docs/superpowers/plans/specs/2026-06-17-issue44-home-image-distribution-design.md`

---

## File Structure

| 檔案 | 責任 | 動作 |
| --- | --- | --- |
| `src/data/style-data.json` | 本地圖庫資料 | 取代為 develop 版（223 筆） |
| `public/style-image/*.webp` | 概念照圖檔 | 新增（develop 版） |
| `src/components/sections/FloatingImageNetwork/config.ts` | preset 與常數 | 放開上限、home preset 加均勻分帶旗標、弱化 y 向心 |
| `src/components/sections/FloatingImageNetwork/layout.ts` | 純 layout 計算 | 新增 `computeEvenYPositions`、依旗標套用 |
| `src/components/sections/FloatingImageNetwork/FloatingImageNetwork.vue` | 元件 | 顯示全部圖（移除 slice 上限） |
| `src/pages/Home.vue` | 首頁 | 容器高度依密度算（900vh） |
| `src/tests/image.service.spec.ts` | 服務測試 | 更新資料相依期望值 |
| `src/tests/Home.spec.ts` | 首頁測試 | 更新概念照張數/組數 |
| `src/tests/floatingImageNetwork.layout.spec.ts` | layout 測試 | 新增（測 `computeEvenYPositions`） |
| `src/tests/FloatingImageNetwork.spec.ts` | 元件測試 | 新增/補（測顯示全部張數） |

**常數：** 密度 `HOME_DENSITY_PER_100VH = 5`。高度 = `(張數 / 5) × 100vh`。45 張 → 900vh。

---

## Task 1: 匯入新資料並修好資料相依的測試

**Files:**
- Modify: `src/data/style-data.json`（checkout）
- Add: `public/style-image/`（checkout）
- Modify: `src/tests/image.service.spec.ts`
- Modify: `src/tests/Home.spec.ts`

- [ ] **Step 1: 從 develop 精準 checkout 資料與圖檔**

Run:
```bash
git checkout origin/develop -- src/data/style-data.json public/style-image/
```

- [ ] **Step 2: 確認資料正確匯入**

Run:
```bash
node -e "const d=require('./src/data/style-data.json'); console.log('total', d.length, '| concept', d.filter(x=>!x.medium).length)"
```
Expected: `total 223 | concept 45`

- [ ] **Step 3: 跑測試，看哪些因資料變動而壞**

Run: `npx vitest run src/tests/image.service.spec.ts src/tests/Home.spec.ts`
Expected: FAIL —「home 期望 3 張」「同組 limit:50 期望 19」等資料相依斷言會壞（新資料 Y2K 有 24 張、概念照 45 張）。

- [ ] **Step 4: 更新 `Home.spec.ts` 的概念照期望（3 → 45、9 組）**

把 `src/tests/Home.spec.ts` 中這段（約 line 114-121）：
```ts
    expect(images).toHaveLength(3);
    expect(new Set(images.map((image) => image.styleGroup))).toEqual(
      new Set([
        'Y2K & Internet Aesthetics',
        'Future Tech & Digital Psychedelia',
        'Decorative & Opulent Art'
      ])
    );
```
改成：
```ts
    expect(images).toHaveLength(45);
    expect(new Set(images.map((image) => image.styleGroup)).size).toBe(9);
    // 每組 5 張概念照
    const perGroup = images.reduce<Record<string, number>>((acc, image) => {
      acc[image.styleGroup] = (acc[image.styleGroup] ?? 0) + 1;
      return acc;
    }, {});
    expect(Object.values(perGroup).every((count) => count === 5)).toBe(true);
```

- [ ] **Step 5: 更新 `image.service.spec.ts` 的資料相依期望**

在 `src/tests/image.service.spec.ts`：

(a) 概念照數量：把「只回本地概念照」測試的 `expect(images).toHaveLength(3)` 改成 `expect(images).toHaveLength(45)`，並把寫死 3 組的 `Set` 斷言改成：
```ts
    expect(new Set(styleGroups).size).toBe(9);
```

(b) 同組數量：把「does not fill related images from another style group」(`limit: 50`) 的 `expect(relatedImages).toHaveLength(19)` 改成 `expect(relatedImages).toHaveLength(23)`（新資料 Y2K 共 24 張，扣掉基準圖 = 23）。

(c) 洗牌/相關度測試：`y2k-main-001`、`y2k-graphic-001`、`y2k-graphic-editorial-001`、`y2k-graphic-brand-001` 在新資料**都存在**，但「最相關的 3 張」是否仍是這 3 張取決於新 style 陣列。若該斷言壞掉，先用下列指令算出新資料中跟 `y2k-main-001` 共享 style 最多的前幾名，再更新斷言的 id：
```bash
node -e "const d=require('./src/data/style-data.json');const b=d.find(x=>x.id==='y2k-main-001');const bs=new Set(b.style);d.filter(x=>x.styleGroup===b.styleGroup&&x.id!==b.id).map(x=>[x.id,x.style.filter(s=>bs.has(s)).length]).sort((a,c)=>c[1]-a[1]).forEach(r=>console.log(r[1],r[0]))"
```
洗牌測試（不同 random → 不同順序）只要 Y2K 內有同分群組就會通過；若偶發失敗，改用該指令確認有 ≥2 張同分者即可。

- [ ] **Step 6: 跑測試確認這兩檔綠**

Run: `npx vitest run src/tests/image.service.spec.ts src/tests/Home.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/data/style-data.json public/style-image src/tests/image.service.spec.ts src/tests/Home.spec.ts
git commit -m "feat(issue44): 匯入 develop 新概念照資料並更新資料相依測試

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 顯示全部圖片（移除數量上限）

**Files:**
- Create/Modify: `src/tests/FloatingImageNetwork.spec.ts`
- Modify: `src/components/sections/FloatingImageNetwork/FloatingImageNetwork.vue:32`

- [ ] **Step 1: 寫失敗測試（給 45 張要渲染 45 張卡片）**

建立或補上 `src/tests/FloatingImageNetwork.spec.ts`：
```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork/FloatingImageNetwork.vue';

function makeImages(count: number) {
  return Array.from({ length: count }, (_, i) => ({ src: `/img-${i}.webp`, alt: `img ${i}` }));
}

describe('FloatingImageNetwork', () => {
  it('renders every provided image without a hardcoded cap', () => {
    const wrapper = mount(FloatingImageNetwork, {
      props: { images: makeImages(45), layout: 'home' },
      global: { stubs: { ConstellationBackground: true } }
    });

    expect(wrapper.findAll('[data-testid="image-card"]')).toHaveLength(45);
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/tests/FloatingImageNetwork.spec.ts`
Expected: FAIL —「expected 6 to be 45」（目前 `slice(0, MAX_IMAGES)` 砍成 6）。

- [ ] **Step 3: 移除數量上限**

在 `src/components/sections/FloatingImageNetwork/FloatingImageNetwork.vue`：

把 import（line 9）的 `MAX_IMAGES` 拿掉：
```ts
import { AMBIENT_DOTS, type ImageItem, type NodePosition } from './config';
```
把 line 32：
```ts
const visibleImages = computed(() => props.images.slice(0, MAX_IMAGES));
```
改成：
```ts
const visibleImages = computed(() => props.images);
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/tests/FloatingImageNetwork.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/FloatingImageNetwork/FloatingImageNetwork.vue src/tests/FloatingImageNetwork.spec.ts
git commit -m "feat(issue44): FloatingImageNetwork 顯示全部圖片、移除 6 張上限

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 首頁容器高度依密度算成 900vh

**Files:**
- Modify: `src/tests/Home.spec.ts`
- Modify: `src/pages/Home.vue`

- [ ] **Step 1: 寫失敗測試（45 張 → 傳 900vh 給 FloatingImageNetwork）**

在 `src/tests/Home.spec.ts` 的 `'passes grouped home inspiration entry points...'` 測試末尾、`await flushPromises()` 之後，加上對 `height` prop 的斷言（stub 已有 `props: ['images']`，需擴充成也收 `height`）。先把檔案頂端的 stub 改成：
```ts
const floatingImageNetworkStub = {
  props: ['images', 'height'],
  template: '<button data-test="floating-image-network" @click="$emit(\'click\', 0)" />'
};
```
再在該測試加：
```ts
    expect(floatingNetwork.props('height')).toBe('900vh');
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/tests/Home.spec.ts`
Expected: FAIL — height 目前是寫死的 `'calc(200vh - var(--app-header-height))'`，不是 `'900vh'`。

- [ ] **Step 3: 在 Home.vue 用 computed 算高度**

在 `src/pages/Home.vue` script：import 加 `computed`（line 2）：
```ts
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
```
在 `inspirationImages` ref 之後加：
```ts
const HOME_DENSITY_PER_100VH = 5;
const containerHeight = computed(
  () => `${(inspirationImages.value.length / HOME_DENSITY_PER_100VH) * 100}vh`
);
```
把 template 的 FloatingImageNetwork（line 87）：
```vue
          height="calc(200vh - var(--app-header-height))"
```
改成：
```vue
          :height="containerHeight"
```
並把外層包住它的容器高度改成跟著走——把 line 82-84 的：
```vue
      <div
        class="absolute inset-x-0 top-[var(--app-header-height)] z-10 h-[calc(112vh-var(--app-header-height))]"
      >
```
改成：
```vue
      <div
        class="absolute inset-x-0 top-[var(--app-header-height)] z-10"
        :style="{ height: containerHeight }"
      >
```
把 `<main>`（line 77）的 `min-h-[160vh]` 與 `<section>`（line 81）的 `min-h-[150vh]` 改用 `:style` 綁定，讓整頁可滾到 900vh：
- `<main>`：移除 `min-h-[160vh]`，加 `:style="{ minHeight: containerHeight }"`。
- `<section>`：移除 `min-h-[150vh]`，加 `:style="{ minHeight: containerHeight }"`。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/tests/Home.spec.ts`
Expected: PASS（45 張 / 5 × 100 = 900vh）

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.vue src/tests/Home.spec.ts
git commit -m "feat(issue44): 首頁容器高度依密度算（45 張 → 900vh）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 初始 y 依索引均勻分帶（純函式 + 接線）

**Files:**
- Create: `src/tests/floatingImageNetwork.layout.spec.ts`
- Modify: `src/components/sections/FloatingImageNetwork/config.ts`（LayoutPreset 加旗標）
- Modify: `src/components/sections/FloatingImageNetwork/layout.ts`

- [ ] **Step 1: 寫失敗測試（均勻分佈）**

建立 `src/tests/floatingImageNetwork.layout.spec.ts`：
```ts
import { describe, expect, it } from 'vitest';
import { computeEvenYPositions } from '@/components/sections/FloatingImageNetwork/layout';

describe('computeEvenYPositions', () => {
  it('spreads nodes evenly across the height, one per slot', () => {
    const height = 9000; // 900vh @ 1000px viewport
    const count = 45;
    const ys = computeEvenYPositions(count, height, () => 0.5);

    expect(ys).toHaveLength(count);
    // 每格 height/count = 200，中點在 (i+0.5)*200
    expect(ys[0]).toBeCloseTo(100, 5);
    expect(ys[count - 1]).toBeCloseTo(height - 100, 5);
    // 單調遞增
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]);
    }
    // 每個 1000px（100vh）帶至少有 5 張 → 無空白螢幕
    for (let band = 0; band < height / 1000; band++) {
      const inBand = ys.filter((y) => y >= band * 1000 && y < (band + 1) * 1000).length;
      expect(inBand).toBe(5);
    }
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/tests/floatingImageNetwork.layout.spec.ts`
Expected: FAIL —「computeEvenYPositions is not a function」。

- [ ] **Step 3: 實作 `computeEvenYPositions` 並接進 buildLayoutNodes**

在 `src/components/sections/FloatingImageNetwork/config.ts` 的 `LayoutPreset` interface 加一個可選旗標（放在 `clampPosition` 之前）：
```ts
  evenYDistribution?: boolean;
```
並在 `home` preset 物件內加 `evenYDistribution: true,`（放在 `ticks: 240,` 之後）。

在 `src/components/sections/FloatingImageNetwork/layout.ts` 加匯出純函式（放在 `getRandomPosition` 之後）：
```ts
export function computeEvenYPositions(
  count: number,
  height: number,
  random: () => number = Math.random
): number[] {
  const slot = height / count;

  return Array.from({ length: count }, (_, i) => (i + random()) * slot);
}
```
把 `buildLayoutNodes` 改成 home 用均勻分帶、其他維持隨機：
```ts
function buildLayoutNodes(count: number, width: number, height: number, preset: LayoutPreset) {
  const evenYs = preset.evenYDistribution ? computeEvenYPositions(count, height) : null;

  return Array.from({ length: count }, (_, i) => ({
    x: getRandomPosition(width * preset.randomX[0], width * preset.randomX[1]),
    y: evenYs ? evenYs[i] : getRandomPosition(height * preset.randomY[0], height * preset.randomY[1]),
    width: preset.widths[i % preset.widths.length],
    aspect: preset.aspects[i % preset.aspects.length],
    constellationSize: preset.constellationSizes?.[i % preset.constellationSizes.length]
  }));
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/tests/floatingImageNetwork.layout.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/FloatingImageNetwork/config.ts src/components/sections/FloatingImageNetwork/layout.ts src/tests/floatingImageNetwork.layout.spec.ts
git commit -m "feat(issue44): 首頁初始 y 依索引均勻分帶，避免空白螢幕

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 弱化 y 向心力（讓圖往下鋪不被拉回中間）

**Files:**
- Modify: `src/components/sections/FloatingImageNetwork/config.ts`（home preset）
- Modify: `src/components/sections/FloatingImageNetwork/layout.ts`（`runLayoutSimulation`）

**背景：** `forceCenter` 會把整體質心拉向 `height * center[1]`（home 為 0.42），在 900vh 上會把均勻分帶的圖往中間壓。改成：home 用 `forceX`（維持水平置中）+ 弱 `forceY`（把每個節點輕輕錨回它均勻分帶的初始 y），其他 layout 維持原 `forceCenter`。

- [ ] **Step 1: 寫失敗測試（home layout 輸出仍鋪滿高度）**

在 `src/tests/floatingImageNetwork.layout.spec.ts` 加：
```ts
import { buildFloatingImageLayout } from '@/components/sections/FloatingImageNetwork/layout';
import { LAYOUT_PRESETS } from '@/components/sections/FloatingImageNetwork/config';

describe('buildFloatingImageLayout (home)', () => {
  it('keeps nodes spread across the full height instead of clustering at the center', () => {
    const width = 1200;
    const height = 9000;
    const nodes = buildFloatingImageLayout(45, width, height, LAYOUT_PRESETS.home);

    const ys = nodes.map((n) => n.y);
    const span = Math.max(...ys) - Math.min(...ys);
    // 鋪滿至少 70% 高度（若被向心力壓到中間，span 會遠小於此）
    expect(span).toBeGreaterThan(height * 0.7);
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/tests/floatingImageNetwork.layout.spec.ts`
Expected: 視現況可能 FAIL（forceCenter 把節點壓向中間，span 不足 70%）。若意外 PASS，仍照 Step 3 改成更穩定的力學模型再確認。

- [ ] **Step 3: 改 `runLayoutSimulation` 的力學模型**

在 `src/components/sections/FloatingImageNetwork/layout.ts`，import 加入 `forceX, forceY`：
```ts
import { forceSimulation, forceCollide, forceCenter, forceManyBody, forceX, forceY } from 'd3-force';
```
把 `runLayoutSimulation` 改成依旗標選力學模型：
```ts
function runLayoutSimulation(
  nodes: NodePosition[],
  width: number,
  height: number,
  preset: LayoutPreset
) {
  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(preset.chargeStrength))
    .force(
      'collide',
      forceCollide((node: NodePosition) => node.width * preset.collideMultiplier).strength(1)
    )
    .stop();

  if (preset.evenYDistribution) {
    // 水平置中、垂直只輕輕錨回均勻分帶的初始 y，避免整體被拉向中間
    simulation
      .force('x', forceX<NodePosition>(width * preset.center[0]).strength(preset.centerStrength))
      .force('y', forceY<NodePosition>((node) => node.y).strength(0.12));
  } else {
    simulation.force(
      'center',
      forceCenter(width * preset.center[0], height * preset.center[1]).strength(preset.centerStrength)
    );
  }

  for (let i = 0; i < preset.ticks; i++) simulation.tick();
}
```

> 註：`forceY((node) => node.y)` 在模擬一開始讀取的是初始 y（均勻分帶值）。因 d3 會逐 tick 移動 node.y，若要嚴格錨回「原始」分帶位置，可在 `buildLayoutNodes` 另存 `node.targetY` 並改用 `forceY((n) => n.targetY)`；先用前者，Step 4 / Task 6 觀察是否足夠。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/tests/floatingImageNetwork.layout.spec.ts`
Expected: PASS（span > 70% 高度）。若仍不足，依上方註記改用 `targetY` 錨定。

- [ ] **Step 5: 跑全測試 + 型別檢查**

Run: `npx vitest run && npx vue-tsc --noEmit`
Expected: 全綠、型別乾淨。

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/FloatingImageNetwork/config.ts src/components/sections/FloatingImageNetwork/layout.ts src/tests/floatingImageNetwork.layout.spec.ts
git commit -m "feat(issue44): home layout 弱化 y 向心力，讓圖均勻往下鋪

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 瀏覽器實機驗證與微調

**Files:** 視觀察結果可能微調 `config.ts`（home preset）。

- [ ] **Step 1: 啟動前端**

Run: `npm run dev`（首頁不需 API/server；概念照走本地 `style-data.json` + `public/style-image`）

- [ ] **Step 2: 開首頁觀察**

開 `http://localhost:5173/`，往下捲，逐項對驗收標準確認：
1. 顯示 45 張概念照（非 6 張）。
2. 總高約 900vh、每捲一個螢幕（100vh）約看到 5 張。
3. 沒有整個空白的螢幕。
4. 圖往下鋪、不擠中間；圖片載入後座標正確（無隱形卡片 / opacity:0）。

> 註：未登入會在捲到 150vh 時跳出每日上限 modal（`scrollLimitVh = 150`，既有產品行為），驗證散佈時可暫時略過或在 devtools 關掉該 listener。

- [ ] **Step 3: 太擠/太鬆就調密度或力道**

- 太擠：把 `Home.vue` 的 `HOME_DENSITY_PER_100VH` 從 5 調小（例如 4 → 高度變 1125vh、每螢幕 4 張）。
- 往中間聚太明顯：把 `config.ts` home preset 的 `centerStrength` 調小，或把 Task 5 的 `forceY` strength（0.12）調大讓錨定更強。
- 改完重跑 `npx vitest run` 確認測試仍綠（layout 測試的 70% span 與 home 900vh 對應 density=5；若改 density 要同步更新 `Home.spec` 的 `'900vh'` 期望）。

- [ ] **Step 4: 最終提交（若有微調）**

```bash
git add -A
git commit -m "fix(issue44): 依實機觀察微調首頁散佈密度/力道

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 驗收標準（對應設計文件）

1. 首頁顯示全部 45 張概念照（9 組各 5），不再截斷成 6 張。
2. 容器高度 900vh，每 100vh 約 5 張，無整個空白的螢幕。
3. 圖往下鋪、不擠中間；非同步載入後座標正確（無 opacity=0 隱形卡片）。
4. `getHomeInspirationImages()` 只回無 medium 的概念照（45 張），不混入延展圖。
5. `npm run test` 全綠、`vue-tsc` 乾淨。
