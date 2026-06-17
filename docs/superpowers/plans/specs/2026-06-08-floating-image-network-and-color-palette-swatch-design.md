# FloatingImageNetwork & ColorPaletteSwatch 設計文件

## 概覽

在 `feat/component` 分支新增兩個可重複使用的 Vue 元件，放置於 `src/components/`。

---

## 元件一：FloatingImageNetwork

### 用途

首頁主要視覺區塊，將圖片陣列渲染為散落分布的圖片卡片，並以 SVG 節點與連線構成網路感視覺。

### Props

```ts
interface ImageItem {
  src: string
  alt?: string
}

defineProps<{
  images: ImageItem[]
}>()
```

### 架構

- 容器：`position: relative`，固定高度 600px，`overflow: hidden`
- SVG 層：絕對定位，鋪滿容器，`z-index: 0`，繪製節點（`<circle>`）與連線（`<line>`）
- 圖片卡片：`position: absolute`，依預設座標陣列對應 props images 順序排列，`z-index: 1`
- 座標定義：最多支援 6 張圖片，百分比座標預設如下：

  | index | left | top  | width |
  |-------|------|------|-------|
  | 0     | 3%   | 25%  | 160px |
  | 1     | 55%  | 8%   | 140px |
  | 2     | 38%  | 50%  | 170px |
  | 3     | 70%  | 45%  | 150px |
  | 4     | 15%  | 62%  | 130px |
  | 5     | 80%  | 18%  | 135px |

- 圖片比例：`aspect-ratio: 3/4`，`object-fit: cover`，`border-radius: 4px`
- 漂浮動畫：CSS `@keyframes floatY`（Y 軸 ±6px），duration 4s，每張圖 delay 錯開 0.8s
- Hover 效果：`transform: scale(1.05)`，邊框改為 `1px solid rgba(240,237,230,0.4)`
- 點擊：emit `click` 事件，帶出圖片 index

### SVG 網路

- 節點（`<circle r="2">`）：散佈在容器各處（12 個固定節點），fill `rgba(240,237,230,0.25)`
- 連線（`<line>`）：連接部分相鄰節點，stroke `rgba(240,237,230,0.12)`，strokeWidth 1

### 樣式規範

- 顏色使用 CSS token：`--color-text-primary`、`--color-elevated`
- 不寫死 hex
- 圖片陣列長度 0 到 6，超過 6 張靜默忽略

---

## 元件二：ColorPaletteSwatch

### 用途

圖片詳情頁的色票展示，接收 hex 色碼陣列並渲染連貫色塊。

### Props

```ts
defineProps<{
  colors: string[]
}>()
```

### 架構

- 外層容器：`padding: 16px`，`background: var(--color-elevated)`，`border-radius: 4px`
- 標題：文字 "color palette"，`font-family: var(--font-family-mono)`，`font-size: 0.875rem`，`color: var(--color-text-secondary)`，margin-bottom 8px
- 色塊列：`display: flex`，高度 64px，`border-radius: 4px`（整條）
- 每個色塊：`flex: 1`，`background-color` 由 inline style 帶入 props 的 hex 字串
- 邊角：色塊列整體套 `overflow: hidden` + `border-radius: 4px`，使兩端自然圓角

### 邊界情況

- 空陣列：不渲染色塊列
- 1 個顏色：單一寬色塊，正常顯示

---

## Git 規範

分支：`feat/component`

Commit 格式：
```
feat(image): 新增 FloatingImageNetwork 元件
feat(ui): 新增 ColorPaletteSwatch 元件
```

---

## 檔案位置

```
src/components/
  FloatingImageNetwork.vue
  ColorPaletteSwatch.vue
```
