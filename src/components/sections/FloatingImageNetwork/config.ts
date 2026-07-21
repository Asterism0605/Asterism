/**
 * FloatingImageNetwork 的靜態設定與型別定義。
 * 集中管理 layout preset、節點資料結構、顯示數量限制與背景點資料，
 * 避免固定設定散落在元件與計算邏輯中。
 */
export interface ImageItem {
  src: string;
  srcset?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  aspect: string;
  constellationSize?: number;
  targetX?: number;
  targetY?: number;
}

export interface AvoidArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
  padding: number;
  minWidth?: number;
  maxWidth?: number;
  // top/bottom 改成相對「第一個 viewport 高度」而非總容器高度，
  // 這樣標題避讓區永遠固定在第一螢幕，不隨容器總高（900vh）放大跑掉。
  viewportRelative?: boolean;
}

export interface LayoutPreset {
  widths: number[];
  aspects: string[];
  constellationSizes?: number[];
  randomX: readonly [number, number];
  randomY: readonly [number, number];
  center: readonly [number, number];
  centerStrength: number;
  chargeStrength: number;
  collideMultiplier: number;
  ticks: number;
  avoidAreas?: AvoidArea[];
  evenYDistribution?: boolean;
  // home 首屏的主視覺錨點：固定在一個安全區內隨機，不是固定死座標。
  homeHeroAnchor?: {
    index: number;
    x: readonly [number, number];
    y: readonly [number, number];
  };
  clampPosition: (node: NodePosition, width: number, height: number) => NodePosition;
}

export const MAX_IMAGES = 6;
export const HOME_HERO_IMAGE_INDEX = 0;

// 首頁卡片的顯示寬度：srcset 的 `sizes` 屬性與行動版 CSS 都要對齊同一組數字。
export const HOME_CARD_WIDTH = { mobile: 132, desktop: 240 } as const;

export const LAYOUT_PRESETS: Record<'auto' | 'home', LayoutPreset> = {
  auto: {
    widths: [130, 150, 160, 170, 200, 210],
    aspects: ['3/4', '3/4', '3/4', '3/4', '4/3', '4/3'],
    randomX: [0.2, 0.8],
    randomY: [0.2, 0.8],
    center: [0.5, 0.5],
    centerStrength: 0.3,
    chargeStrength: -60,
    collideMultiplier: 0.65,
    ticks: 200,
    clampPosition(node, width, height) {
      return {
        x: Math.max(node.width / 2, Math.min(width - node.width, node.x - node.width / 2)),
        y: Math.max(0, Math.min(height - 80, node.y - 80)),
        width: node.width,
        aspect: node.aspect
      };
    }
  },
  home: {
    widths: [240, 240, 240, 240, 240, 240],
    aspects: ['3/4', '16/10', '3/4', '3/4', '4/3', '3/4'],
    randomX: [0.14, 0.86],
    randomY: [0.12, 0.78],
    center: [0.5, 0.42],
    centerStrength: 0.22,
    chargeStrength: -45,
    collideMultiplier: 0.72,
    ticks: 600,
    evenYDistribution: true,
    // 讓標題右側一定有一張完整圖片；x/y 是可隨機的比例範圍。
    homeHeroAnchor: {
      index: HOME_HERO_IMAGE_INDEX,
      x: [0.7, 0.84],
      y: [0.34, 0.5]
    },
    avoidAreas: [
      {
        left: 0,
        top: 0.16,
        right: 0.58,
        bottom: 0.48,
        padding: 16,
        maxWidth: 767,
        viewportRelative: true
      },
      {
        left: 0,
        top: 0.28,
        right: 0.62,
        bottom: 0.64,
        padding: 32,
        minWidth: 768,
        viewportRelative: true
      }
    ],
    clampPosition(node, width, height) {
      return {
        x: Math.max(node.width / 2, Math.min(width - node.width / 2, node.x)),
        y: Math.max(80, Math.min(height - 120, node.y)),
        width: node.width,
        aspect: node.aspect,
        constellationSize: node.constellationSize
      };
    }
  }
};

export const AMBIENT_DOTS = [
  { left: '35%', top: '8%' },
  { left: '49%', top: '13%' },
  { left: '62%', top: '6%' },
  { left: '75%', top: '2%' },
  { left: '87%', top: '9%' },
  { left: '94%', top: '3%' },
  { left: '43%', top: '33%' },
  { left: '50%', top: '58%' },
  { left: '85%', top: '58%' },
  { left: '90%', top: '80%' },
  { left: '20%', top: '83%' },
  { left: '32%', top: '80%' },
  { left: '65%', top: '25%' },
  { left: '82%', top: '33%' }
] as const;
