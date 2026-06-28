// 風格分類的中英對照（顯示用）。DB / API 一律存英文，UI 只把英文映成中文顯示，
// 下拉選單的 value 仍是英文，送出時不受影響。

export const STYLE_GROUP_ZH: Record<string, string> = {
  'Future Tech & Digital Psychedelia': '未來科技與數位迷幻',
  'Y2K & Internet Aesthetics': 'Y2K 千禧網路美學',
  'Decorative & Opulent Art': '裝飾與華麗藝術',
  'Minimal & Structured Modern': '極簡與結構現代',
  'Earth & Organic Humanism': '大地與有機人文',
  'Romantic & Pastoral Living': '浪漫與田園生活',
  'Retro & Nostalgia': '復古與懷舊',
  'Experimental & Avant-Garde': '實驗與前衛',
  'Street & Youth Culture': '街頭與青年文化'
};

export const MEDIUM_ZH: Record<string, string> = {
  Outfit: '服裝',
  'Graphic Design': '平面設計',
  'Interior Design': '室內設計',
  Architecture: '建築'
};

export const SUB_MEDIUM_ZH: Record<string, string> = {
  // Graphic Design
  'Brand Identity': '品牌識別',
  'Poster Design': '海報設計',
  'Editorial Design': '編輯設計',
  'Packaging Design': '包裝設計',
  // Outfit
  Top: '上衣',
  Bottom: '下著',
  Dress: '洋裝',
  Accessory: '配件',
  // Interior Design
  Lighting: '燈具照明',
  Table: '桌子',
  'Wall Paint': '牆面塗裝',
  Chair: '椅子',
  // Architecture
  Window: '窗戶',
  Staircase: '樓梯',
  Facade: '立面',
  Entrance: '入口'
};

// 審核工具 correct 下拉用的靜態 taxonomy（DB 存英文）。
export const MEDIUMS = ['Outfit', 'Graphic Design', 'Interior Design', 'Architecture'];

export const SUB_MEDIUMS_BY_MEDIUM: Record<string, string[]> = {
  'Graphic Design': ['Brand Identity', 'Poster Design', 'Editorial Design', 'Packaging Design'],
  Outfit: ['Top', 'Bottom', 'Dress', 'Accessory'],
  'Interior Design': ['Lighting', 'Table', 'Wall Paint', 'Chair'],
  Architecture: ['Window', 'Staircase', 'Facade', 'Entrance']
};

export function styleGroupZh(value?: string | null): string {
  return value ? (STYLE_GROUP_ZH[value] ?? value) : '';
}

export function mediumZh(value?: string | null): string {
  return value ? (MEDIUM_ZH[value] ?? value) : '';
}

export function subMediumZh(value?: string | null): string {
  return value ? (SUB_MEDIUM_ZH[value] ?? value) : '';
}
