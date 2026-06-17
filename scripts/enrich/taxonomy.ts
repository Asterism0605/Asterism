// 9 個 styleGroup 的 CLIP 錨點文字（給 zero-shot 分類比對用的英文描述）。
// 對齊 docs/superpowers/specs/2026-06-16-issue22-frontend-demo-design.md §4。
export const STYLE_GROUP_ANCHORS: Record<string, string> = {
  'Future Tech & Digital Psychedelia': 'cyberpunk futurism glitch art techwear neo-tokyo',
  'Y2K & Internet Aesthetics': 'Y2K frutiger aero McBling chrome design bubblegum futurism',
  'Decorative & Opulent Art': 'art deco baroque rococo maximalism ornate luxury',
  'Minimal & Structured Modern': 'minimalism quiet luxury scandinavian modernism swiss design',
  'Earth & Organic Humanism': 'wabi-sabi japandi biophilic design organic modern',
  'Romantic & Pastoral Living': 'cottagecore romanticism grandmillennial vintage floral',
  'Retro & Nostalgia': 'vintage retro mid-century modern americana',
  'Experimental & Avant-Garde':
    'brutalism anti-design deconstructivism avant-garde experimental typography',
  'Street & Youth Culture': 'streetwear hypebeast graffiti urban contemporary skate culture'
};

// 每個 styleGroup 的 style[] 候選詞 —— CLIP 多標籤分類只在對應群組的詞庫裡比。
// 前 3 組沿用 src/data/style-data.json 既有資料；其餘 6 組從上面的錨點文字萃取代表詞
// （demo 用詞庫，未來校準可直接改這裡，不影響其他檔案）。
export const STYLE_VOCAB_BY_GROUP: Record<string, string[]> = {
  'Future Tech & Digital Psychedelia': [
    'Cyberpunk',
    'Neo Tokyo',
    'Future Tech',
    'Digital Psychedelia',
    'Glitch Aesthetic'
  ],
  'Y2K & Internet Aesthetics': [
    'Y2K',
    'Frutiger Aero',
    'McBling',
    'Chrome Design',
    'Bubblegum Futurism'
  ],
  'Decorative & Opulent Art': [
    'Baroque',
    'Rococo',
    'Art Deco',
    'Gilded Ornament',
    'Opulent Classicism'
  ],
  'Minimal & Structured Modern': [
    'Minimalism',
    'Quiet Luxury',
    'Scandinavian Modernism',
    'Swiss Design'
  ],
  'Earth & Organic Humanism': ['Wabi-Sabi', 'Japandi', 'Biophilic Design', 'Organic Modernism'],
  'Romantic & Pastoral Living': [
    'Cottagecore',
    'Romanticism',
    'Grandmillennial',
    'Vintage Floral'
  ],
  'Retro & Nostalgia': ['Vintage', 'Retro', 'Mid-Century Modern', 'Americana'],
  'Experimental & Avant-Garde': [
    'Brutalism',
    'Anti-Design',
    'Deconstructivism',
    'Experimental Typography'
  ],
  'Street & Youth Culture': ['Streetwear', 'Hypebeast', 'Graffiti', 'Skate Culture']
};

export const MEDIUM_LABELS: string[] = [
  'Outfit',
  'Graphic Design',
  'Interior Design',
  'Architecture'
];

// 只有 Graphic Design 有子分類（對齊現有 style-data.json）。
// 其餘 medium 無子類 → subMedium 留空。新子類由人工加進來。
export const SUBMEDIUM_BY_MEDIUM: Record<string, string[]> = {
  'Graphic Design': ['Poster Design', 'Editorial Design', 'Branding']
};

export const THRESHOLDS = {
  styleGroup: 0.6,
  medium: 0.5,
  subMedium: 0.35
} as const;

export const STYLE_TOP_K = 4;
