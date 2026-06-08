# FloatingImageNetwork & ColorPaletteSwatch 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `feat/component` 分支新增 `FloatingImageNetwork.vue` 與 `ColorPaletteSwatch.vue` 兩個可重用 Vue 3 元件。

**Architecture:** FloatingImageNetwork 以 `position: absolute` 配置圖片卡片、SVG 層繪製節點與連線、CSS keyframes 做漂浮動畫。ColorPaletteSwatch 以 flex 等分色塊搭配 inline style 渲染 hex 色碼。

**Tech Stack:** Vue 3 + TypeScript + Tailwind CSS v4（`@theme` token）+ Vitest + @vue/test-utils

---

## 檔案結構

| 動作 | 路徑 | 職責 |
|------|------|------|
| 修改 | `vite.config.ts` | 加入 vitest 設定 |
| 修改 | `package.json` | 新增 vitest、@vue/test-utils 依賴 |
| 建立 | `src/components/ColorPaletteSwatch.vue` | 色票元件 |
| 建立 | `src/components/FloatingImageNetwork.vue` | 浮動圖片網路元件 |
| 建立 | `src/tests/ColorPaletteSwatch.spec.ts` | 色票元件測試 |
| 建立 | `src/tests/FloatingImageNetwork.spec.ts` | 浮動圖片網路測試 |

---

## Task 0：設定 Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/tests/` (目錄)

- [ ] **Step 1：安裝測試依賴**

```bash
cd C:\Users\miche\Asterism
npm install -D vitest @vue/test-utils @vitejs/plugin-vue jsdom
```

Expected output: 成功安裝，`package-lock.json` 更新

- [ ] **Step 2：更新 vite.config.ts，加入 vitest 環境設定**

將 `vite.config.ts` 改為：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3：在 tsconfig.json 的 compilerOptions 加入 vitest types**

讀取 `tsconfig.json`，在 `compilerOptions.types` 陣列中加入 `"vitest/globals"`：

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

若 `types` 不存在則新增該欄位。

- [ ] **Step 4：在 package.json scripts 加入 test 指令**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5：確認 vitest 可執行**

```bash
npx vitest run --reporter=verbose
```

Expected: 無測試檔案時顯示 "No test files found" 或通過 0 個測試，無錯誤。

- [ ] **Step 6：Commit**

```bash
git add vite.config.ts package.json package-lock.json tsconfig.json
git commit -m "chore(deps): 新增 Vitest 測試環境設定"
```

---

## Task 1：ColorPaletteSwatch 元件（TDD）

**Files:**
- Create: `src/tests/ColorPaletteSwatch.spec.ts`
- Create: `src/components/ColorPaletteSwatch.vue`

### Step 1：寫測試（先跑失敗）

- [ ] **建立測試檔案 `src/tests/ColorPaletteSwatch.spec.ts`**

```ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ColorPaletteSwatch from '@/components/ColorPaletteSwatch.vue'

describe('ColorPaletteSwatch', () => {
  it('renders the "color palette" label', () => {
    const wrapper = mount(ColorPaletteSwatch, { props: { colors: [] } })
    expect(wrapper.text()).toContain('color palette')
  })

  it('renders no color blocks when colors is empty', () => {
    const wrapper = mount(ColorPaletteSwatch, { props: { colors: [] } })
    expect(wrapper.findAll('[data-testid="color-block"]').length).toBe(0)
  })

  it('renders correct number of color blocks', () => {
    const wrapper = mount(ColorPaletteSwatch, {
      props: { colors: ['#FFF', '#CCC', '#000'] },
    })
    expect(wrapper.findAll('[data-testid="color-block"]').length).toBe(3)
  })

  it('applies correct background-color to each block', () => {
    const wrapper = mount(ColorPaletteSwatch, {
      props: { colors: ['#FF0000', '#00FF00'] },
    })
    const blocks = wrapper.findAll('[data-testid="color-block"]')
    expect(blocks[0].attributes('style')).toContain('background-color: rgb(255, 0, 0)')
    expect(blocks[1].attributes('style')).toContain('background-color: rgb(0, 255, 0)')
  })
})
```

- [ ] **Step 2：跑測試確認失敗**

```bash
cd C:\Users\miche\Asterism
npx vitest run src/tests/ColorPaletteSwatch.spec.ts --reporter=verbose
```

Expected: FAIL — "Cannot find module '@/components/ColorPaletteSwatch.vue'"

### Step 3：實作元件

- [ ] **建立 `src/components/ColorPaletteSwatch.vue`**

```vue
<script setup lang="ts">
defineProps<{
  colors: string[]
}>()
</script>

<template>
  <div class="p-4 bg-elevated rounded">
    <p class="text-caption font-mono text-text-secondary mb-2">color palette</p>
    <div v-if="colors.length" class="flex h-16 rounded overflow-hidden">
      <div
        v-for="(color, i) in colors"
        :key="i"
        data-testid="color-block"
        class="flex-1"
        :style="{ backgroundColor: color }"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 4：跑測試確認通過**

```bash
npx vitest run src/tests/ColorPaletteSwatch.spec.ts --reporter=verbose
```

Expected: 全部 4 個測試 PASS

- [ ] **Step 5：Commit**

```bash
git add src/components/ColorPaletteSwatch.vue src/tests/ColorPaletteSwatch.spec.ts
git commit -m "feat(ui): 新增 ColorPaletteSwatch 元件"
```

---

## Task 2：FloatingImageNetwork 元件（TDD）

**Files:**
- Create: `src/tests/FloatingImageNetwork.spec.ts`
- Create: `src/components/FloatingImageNetwork.vue`

### Step 1：寫測試（先跑失敗）

- [ ] **建立測試檔案 `src/tests/FloatingImageNetwork.spec.ts`**

```ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FloatingImageNetwork from '@/components/FloatingImageNetwork.vue'

const mockImages = [
  { src: '/img1.jpg', alt: 'image 1' },
  { src: '/img2.jpg', alt: 'image 2' },
  { src: '/img3.jpg', alt: 'image 3' },
]

describe('FloatingImageNetwork', () => {
  it('renders without errors with empty images array', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: [] } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders correct number of img elements', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } })
    expect(wrapper.findAll('img').length).toBe(3)
  })

  it('sets correct src and alt on each img', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } })
    const imgs = wrapper.findAll('img')
    expect(imgs[0].attributes('src')).toBe('/img1.jpg')
    expect(imgs[0].attributes('alt')).toBe('image 1')
    expect(imgs[1].attributes('src')).toBe('/img2.jpg')
  })

  it('ignores images beyond index 5 (max 6)', () => {
    const sevenImages = Array.from({ length: 7 }, (_, i) => ({
      src: `/img${i}.jpg`,
      alt: `image ${i}`,
    }))
    const wrapper = mount(FloatingImageNetwork, { props: { images: sevenImages } })
    expect(wrapper.findAll('img').length).toBe(6)
  })

  it('emits click event with image index when image card is clicked', async () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } })
    await wrapper.findAll('[data-testid="image-card"]')[1].trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([1])
  })

  it('renders an SVG element for the network', () => {
    const wrapper = mount(FloatingImageNetwork, { props: { images: mockImages } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
```

- [ ] **Step 2：跑測試確認失敗**

```bash
npx vitest run src/tests/FloatingImageNetwork.spec.ts --reporter=verbose
```

Expected: FAIL — "Cannot find module '@/components/FloatingImageNetwork.vue'"

### Step 3：實作元件

- [ ] **建立 `src/components/FloatingImageNetwork.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface ImageItem {
  src: string
  alt?: string
}

const props = defineProps<{
  images: ImageItem[]
}>()

const emit = defineEmits<{
  click: [index: number]
}>()

const IMAGE_POSITIONS = [
  { left: '3%',  top: '25%', width: '160px' },
  { left: '55%', top: '8%',  width: '140px' },
  { left: '38%', top: '50%', width: '170px' },
  { left: '70%', top: '45%', width: '150px' },
  { left: '15%', top: '62%', width: '130px' },
  { left: '80%', top: '18%', width: '135px' },
] as const

const NETWORK_NODES = [
  { x: 5,  y: 15 }, { x: 20, y: 5  }, { x: 45, y: 10 },
  { x: 65, y: 20 }, { x: 85, y: 5  }, { x: 90, y: 35 },
  { x: 75, y: 65 }, { x: 55, y: 80 }, { x: 35, y: 75 },
  { x: 10, y: 85 }, { x: 5,  y: 55 }, { x: 30, y: 40 },
]

const NETWORK_LINES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [11, 0], [1, 11], [3, 8], [2, 10],
]

const visibleImages = computed(() => props.images.slice(0, 6))
</script>

<template>
  <div class="relative w-full overflow-hidden" style="height: 600px;">
    <!-- SVG network layer -->
    <svg
      class="absolute inset-0 w-full h-full"
      style="z-index: 0;"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        v-for="([from, to], i) in NETWORK_LINES"
        :key="`line-${i}`"
        :x1="NETWORK_NODES[from].x"
        :y1="NETWORK_NODES[from].y"
        :x2="NETWORK_NODES[to].x"
        :y2="NETWORK_NODES[to].y"
        stroke="rgba(240,237,230,0.12)"
        stroke-width="0.3"
      />
      <circle
        v-for="(node, i) in NETWORK_NODES"
        :key="`node-${i}`"
        :cx="node.x"
        :cy="node.y"
        r="0.6"
        fill="rgba(240,237,230,0.25)"
      />
    </svg>

    <!-- Image cards -->
    <!--
      floatY 使用 transform: translateY，hover scale 改用獨立的 CSS `scale` property
      避免兩者都操作 transform 互相覆蓋
    -->
    <div
      v-for="(image, i) in visibleImages"
      :key="i"
      data-testid="image-card"
      class="image-card absolute cursor-pointer"
      :style="{
        left: IMAGE_POSITIONS[i].left,
        top: IMAGE_POSITIONS[i].top,
        width: IMAGE_POSITIONS[i].width,
        zIndex: 1,
        animationDelay: `${i * 0.8}s`,
      }"
      @click="emit('click', i)"
    >
      <img
        :src="image.src"
        :alt="image.alt ?? ''"
        class="w-full"
        style="aspect-ratio: 3/4; object-fit: cover; display: block; border-radius: 4px;"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes floatY {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}

.image-card {
  animation: floatY 4s ease-in-out infinite;
  border: 1px solid rgba(240, 237, 230, 0.12);
  border-radius: 4px;
  /* scale 是獨立 CSS property，不影響 transform animation */
  transition: scale 0.3s ease, border-color 0.3s ease;
}

.image-card:hover {
  scale: 1.05;
  border-color: rgba(240, 237, 230, 0.4);
}
</style>
```

- [ ] **Step 4：跑測試確認通過**

```bash
npx vitest run src/tests/FloatingImageNetwork.spec.ts --reporter=verbose
```

Expected: 全部 6 個測試 PASS

- [ ] **Step 5：Commit**

```bash
git add src/components/FloatingImageNetwork.vue src/tests/FloatingImageNetwork.spec.ts
git commit -m "feat(image): 新增 FloatingImageNetwork 元件"
```

---

## Task 3：全部測試驗收

- [ ] **Step 1：跑全部測試**

```bash
cd C:\Users\miche\Asterism
npx vitest run --reporter=verbose
```

Expected: 全部 10 個測試 PASS，無 error

- [ ] **Step 2：確認分支狀態**

```bash
git log --oneline -5
git status
```

Expected:
- working tree clean
- 最新 3 個 commit 為 `feat(image)`、`feat(ui)`、`chore(deps)`

---

## 注意事項

- **不寫死 hex**：元件內顏色一律用 Tailwind token（`bg-elevated`、`text-text-secondary`）或 CSS variable，只有 SVG 的 `stroke` / `fill` 因為不支援 Tailwind class 才直接寫 `rgba()`
- **漂浮動畫與 hover 共存**：hover 時 `scale(1.05)` 是額外疊加，`floatY` 動畫繼續執行，兩者不互斥
- **`animationDelay` inline style**：因為需要動態帶入 `${i * 0.8}s`，無法用 Tailwind class，用 `:style` binding
