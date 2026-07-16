// 風格分類的中英對照（顯示用）。DB / API 一律存英文，UI 只把英文映成中文顯示，
// 下拉選單的 value 仍是英文，送出時不受影響。

export const MEDIUM_ZH: Record<string, string> = {
  'Outfit': '服裝',
  'Graphic Design': '平面設計',
  'Interior Design': '室內設計',
  'Architecture': '建築'
};

export const SUB_MEDIUM_ZH: Record<string, string> = {
  // Graphic Design
  'Brand Identity': '品牌識別',
  'Poster Design': '海報設計',
  'Editorial Design': '編輯設計',
  'Packaging Design': '包裝設計',

  // Outfit（issue #137 場景型；抓圖標籤帶 Focus，中文顯示不含 Focus）
  'Full Look': '整體穿搭',
  'Top Focus': '上身',
  'Bottom Focus': '下身',
  'Accessory Focus': '配件',

  // Interior Design（issue #137 場景型）
  'Living & Dining Space': '起居餐飲空間',
  'Bedroom': '臥室',
  'Lighting': '燈具照明',
  'Decor Detail': '裝飾細節',

  // Architecture（issue #137 場景型）
  'Building Exterior': '建築外觀',
  'Facade': '建築立面',
  'Entrance': '入口',
  'Passage': '通道',

  // 舊分類（issue #137 改版前），策展凍結資料 style-data.json 仍在用，只留顯示對照
  'Top': '上衣',
  'Bottom': '下著',
  'Dress': '洋裝',
  'Accessory': '配件',
  'Table': '桌子',
  'Wall Paint': '牆面塗裝',
  'Chair': '椅子',
  'Window': '窗戶',
  'Staircase': '樓梯'
};

// 英文顯示覆寫：Outfit 的 "...Focus" 抓圖標籤在前端英文介面拿掉 Focus。
// 只覆寫這三個；其餘 subMedium 英文顯示 = 原標籤（localizeTaxon 對非 zh 的 fallback）。
export const SUB_MEDIUM_EN: Record<string, string> = {
  'Top Focus': 'Top',
  'Bottom Focus': 'Bottom',
  'Accessory Focus': 'Accessory'
};

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

export const STYLE_TAG_ZH: Record<string, string> = {
  // Future Tech & Digital Psychedelia
  'Cyberpunk': '賽博龐克',
  'Futurism': '未來主義',
  'Glitch Art': '故障藝術',
  'Neo-Tokyo': '新東京風格',
  'Techwear': '機能風',

  // Y2K & Internet Aesthetics
  'Bubblegum Futurism': '泡泡糖未來主義',
  'Chrome Design': '金屬鍍鉻風格',
  'Frutiger Aero': '生態科技美學',
  'McBling': '閃鑽千禧風',
  'Y2K': '千禧年風格',

  // Decorative & Opulent Art
  'Art Deco': '裝飾藝術',
  'Baroque': '巴洛克',
  'Maximalism': '極繁主義',
  'Rococo': '洛可可',

  // Minimal & Structured Modern
  'Minimalism': '極簡主義',
  'Modernism': '現代主義',
  'Quiet Luxury': '低調奢華',
  'Scandinavian': '北歐風格',
  'Swiss Design': '瑞士設計風格',

  // Earth & Organic Humanism
  'Biophilic Design': '親自然設計',
  'Japandi': '北歐侘寂風',
  'Organic Modern': '有機現代風格',
  'Wabi-Sabi': '侘寂',

  // Romantic & Pastoral Living
  'Cottagecore': '鄉村田園風格',
  'Grandmillennial': '千禧復古主義',
  'Romanticism': '浪漫主義',
  'Vintage Floral': '復古花卉',

  // Retro & Nostalgia
  'Americana': '美式懷舊',
  'Mid-Century Modern': '中世紀現代風',
  'Retro': '摩登復古',
  'Vintage': '時代經典',

  // Experimental & Avant-Garde
  'Anti-Design': '反設計主義',
  'Avant-Garde': '前衛藝術',
  'Brutalism': '粗獷主義',
  'Deconstructivism': '解構主義',
  'Experimental Typography': '實驗性字體設計',

  // Street & Youth Culture
  'Graffiti': '塗鴉藝術',
  'Hypebeast': '潮流風尚',
  'Skate Culture': '滑板文化',
  'Streetwear': '街頭穿搭',
  'Urban Contemporary': '都會當代'
};

// 審核工具 correct 下拉用的靜態 taxonomy（DB 存英文）。
export const MEDIUMS = ['Outfit', 'Graphic Design', 'Interior Design', 'Architecture'];

export const SUB_MEDIUMS_BY_MEDIUM: Record<string, string[]> = {
  'Graphic Design': ['Brand Identity', 'Poster Design', 'Editorial Design', 'Packaging Design'],
  Outfit: ['Full Look', 'Top Focus', 'Bottom Focus', 'Accessory Focus'],
  'Interior Design': ['Living & Dining Space', 'Bedroom', 'Lighting', 'Decor Detail'],
  Architecture: ['Building Exterior', 'Facade', 'Entrance', 'Passage']
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

export function styleTagZh(value?: string | null): string {
  return value ? (STYLE_TAG_ZH[value] ?? value) : '';
}
