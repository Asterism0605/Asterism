// 45 個風格標籤（對照 src/data/styleLabels.ts 的 STYLE_TAG_ZH）各自的一句話描述，
// 給 Style DNA 結果頁的標籤說明彈窗用。key 必須與 STYLE_TAG_ZH 完全一致。

export interface StyleTagDescription {
  zh: string;
  en: string;
}

export const STYLE_TAG_DESCRIPTIONS: Record<string, StyleTagDescription> = {
  // Future Tech & Digital Psychedelia
  'Cyberpunk': {
    zh: '高科技與低生活的衝突美學，霓虹光影下的反烏托邦想像。',
    en: 'High tech, low life — neon-lit dystopia where circuitry meets rebellion.'
  },
  'Digital Psychedelia': {
    zh: '數位分形與幾何幻象，視覺迷幻感在螢幕上炸裂而生。',
    en: 'Digital fractals and geometric illusions — psychedelic visuals exploding across the screen.'
  },
  'Future Tech': {
    zh: '簡潔冷調的科技美感，未來在更新、更乾淨的形式裡。',
    en: 'Clean, cool technological aesthetics — the future in sleeker, more refined forms.'
  },
  'Futurism': {
    zh: '歌頌速度、機械與進步的信仰，線條裡藏著奔向未來的衝動。',
    en: 'A belief in speed, machinery, and progress — lines that lean forward into tomorrow.'
  },
  'Glitch Art': {
    zh: '把數位錯誤變成美學語言，破碎的畫面裡藏著另一種真實。',
    en: 'Digital error turned into aesthetic — broken pixels revealing a different kind of truth.'
  },
  'Neo-Tokyo': {
    zh: '霓虹招牌與濕漉街道交織，賽博未來裡的都市迷離感。',
    en: 'Neon signage and rain-slicked streets — an urban haze somewhere between now and the future.'
  },
  'Techwear': {
    zh: '機能剪裁與科技面料，為都市生存打造的移動裝備。',
    en: 'Technical tailoring and performance fabric — gear engineered for urban survival.'
  },

  // Y2K & Internet Aesthetics
  'Bubblegum Futurism': {
    zh: '糖果色澤包裹著未來科技，天真又閃亮的樂觀想像。',
    en: 'Candy-colored casing around future tech — an innocent, shiny kind of optimism.'
  },
  'Chrome Design': {
    zh: '鏡面反光與液態金屬質感，千禧年對「未來」最直白的想像。',
    en: "Mirror-polished surfaces and liquid metal finishes — the millennium's most literal idea of the future."
  },
  'Frutiger Aero': {
    zh: '玻璃光澤、水滴與藍天綠地並存，早期網路對美好生活的樂觀投射。',
    en: 'Glossy glass, water droplets, and blue skies — early-internet optimism about a better, cleaner life.'
  },
  'McBling': {
    zh: '水鑽、名牌 logo 與高飽和色彩，張揚到毫不掩飾的千禧奢華。',
    en: 'Rhinestones, logomania, and saturated color — millennium luxury with nothing held back.'
  },
  'Y2K': {
    zh: '世紀之交的樂觀與科技幻想，金屬感與亮片交織出的未來憧憬。',
    en: 'Turn-of-the-millennium optimism — metallics and sparkle imagining what the future would look like.'
  },

  // Decorative & Opulent Art
  'Art Deco': {
    zh: '幾何線條與奢華材質的對話，向 1920 年代的摩登都會致敬。',
    en: 'Geometric symmetry meets luxe materials — a nod to 1920s modern glamour.'
  },
  'Baroque': {
    zh: '誇張的曲線與濃烈明暗對比，戲劇張力堆疊出的華麗劇場感。',
    en: 'Dramatic curves and heavy chiaroscuro — theatrical grandeur built through excess.'
  },
  'Gilded Ornament': {
    zh: '金箔與閃耀裝飾，細節裡藏著精妙的手藝與奢華感。',
    en: 'Gold leaf and gleaming details — craftsmanship and opulence hiding in every detail.'
  },
  'Maximalism': {
    zh: '拒絕留白，用層層疊疊的色彩與圖案訴說「更多才夠」。',
    en: 'No blank space left behind — pattern on pattern, color on color, because more is the point.'
  },
  'Opulent Classicism': {
    zh: '古典藝術的尊榮感，華麗的規則與對稱裡藏著久遠的權勢。',
    en: 'Classical grandeur — where ornate symmetry and rules channel ancient majesty and power.'
  },
  'Rococo': {
    zh: '貝殼曲線與粉彩色調，輕盈纖細裡帶著宮廷式的甜美奢靡。',
    en: 'Shell-shaped curves and pastel hues — delicate, courtly sweetness with a touch of excess.'
  },

  // Minimal & Structured Modern
  'Minimalism': {
    zh: '去掉一切多餘，用留白與比例說話的克制美學。',
    en: 'Stripped of everything unnecessary — an aesthetic of restraint told through space and proportion.'
  },
  'Modernism': {
    zh: '形隨機能而生，相信理性與簡潔能塑造更好的生活。',
    en: 'Form follows function — a belief that reason and clarity can shape a better life.'
  },
  'Quiet Luxury': {
    zh: '沒有 logo 也認得出的質感，安靜地展示真正的講究。',
    en: 'Recognizable without a logo — quality that speaks quietly but unmistakably.'
  },
  'Scandinavian': {
    zh: '淺色木質與自然光線，把「舒適」變成一種設計原則。',
    en: 'Light wood and natural daylight — comfort treated as a design principle, not an afterthought.'
  },
  'Swiss Design': {
    zh: '網格系統與無襯線字體，資訊清晰是最高原則。',
    en: 'Grid systems and sans-serif type — where clarity of information comes before everything else.'
  },

  // Earth & Organic Humanism
  'Biophilic Design': {
    zh: '把植物與自然光引入空間，讓生活重新貼近自然節奏。',
    en: "Bringing plants and natural light indoors — reconnecting daily life with nature's rhythm."
  },
  'Japandi': {
    zh: '日式侘寂的靜謐遇上北歐的溫暖木質，兩種簡約在此交會。',
    en: 'Japanese quietude meets Scandinavian warmth — two minimalisms finding common ground.'
  },
  'Organic Modern': {
    zh: '自然材質配上簡潔線條，柔和曲線軟化了現代空間的冷硬。',
    en: 'Natural materials with clean lines — soft curves taking the edge off modern spaces.'
  },
  'Wabi-Sabi': {
    zh: '在不完美與歲月痕跡裡，看見事物最真實的美。',
    en: 'Finding quiet beauty in imperfection, impermanence, and the marks of time.'
  },

  // Romantic & Pastoral Living
  'Cottagecore': {
    zh: '手作陶器與野花桌布，對慢活與田園生活的溫柔嚮往。',
    en: 'Handmade pottery and wildflower linens — a gentle longing for a slower, pastoral life.'
  },
  'Grandmillennial': {
    zh: '祖母的花布沙發被重新詮釋，復古元素混搭出俏皮新意。',
    en: "Grandma's floral upholstery, reimagined — vintage pieces remixed with a playful new attitude."
  },
  'Romanticism': {
    zh: '強調情感與想像的力量，畫面裡總帶著詩意與戲劇性。',
    en: 'Emotion and imagination take the lead — every scene carries a touch of poetry and drama.'
  },
  'Vintage Floral': {
    zh: '泛黃壁紙般的花卉印花，帶著時光沉澱後的柔軟懷舊感。',
    en: 'Faded wallpaper florals — a soft nostalgia that only comes with time.'
  },

  // Retro & Nostalgia
  'Americana': {
    zh: '復古招牌與公路旅行的意象，懷念一種樂觀直率的美式生活。',
    en: 'Vintage signage and open-road imagery — nostalgia for a straightforward, optimistic American life.'
  },
  'Mid-Century Modern': {
    zh: '有機曲線遇上實用主義，1950 年代對未來生活的樂觀想像。',
    en: 'Organic curves meet practicality — 1950s optimism about what everyday life could become.'
  },
  'Retro': {
    zh: '從過去挑選經典元素，重新混搭出帶點玩心的懷舊感。',
    en: 'Picking the best of the past and remixing it with a playful, nostalgic twist.'
  },
  'Vintage': {
    zh: '未經修飾的時代質感，物件本身就是最好的故事。',
    en: 'Unpolished, era-true texture — the object itself already tells the story.'
  },

  // Experimental & Avant-Garde
  'Anti-Design': {
    zh: '刻意打破設計常規，用不協調挑戰「好品味」的既定標準。',
    en: 'Deliberately breaking design conventions — clashing on purpose to question what "good taste" even means.'
  },
  'Avant-Garde': {
    zh: '走在時代前面的實驗精神，不怕打破既有的審美規則。',
    en: "An experimental spirit ahead of its time — unafraid to break the rules everyone else follows."
  },
  'Brutalism': {
    zh: '裸露的混凝土與誠實的結構，拒絕修飾的原始力量感。',
    en: 'Raw concrete and honest structure — an unapologetic, unornamented sense of power.'
  },
  'Deconstructivism': {
    zh: '打破幾何常規的破碎線條，在失衡中找到新的張力。',
    en: 'Fractured geometry that defies convention — finding new tension in deliberate imbalance.'
  },
  'Experimental Typography': {
    zh: '把文字當作圖像實驗，挑戰閱讀與視覺的邊界。',
    en: 'Treating letterforms as visual experiments — pushing where readability ends and image begins.'
  },

  // Street & Youth Culture
  'Graffiti': {
    zh: '街頭牆面上的即興表達，用色彩與筆觸宣示存在感。',
    en: 'Improvised expression on city walls — color and gesture claiming space and voice.'
  },
  'Hypebeast': {
    zh: '聯名與限量的追逐，用穿搭宣告自己站在潮流最前線。',
    en: "Chasing collabs and limited drops — dressing to prove you're first in line."
  },
  'Skate Culture': {
    zh: '街頭滑板場的自由與叛逆，寬鬆剪裁裡藏著不受拘束的態度。',
    en: 'The freedom and rebellion of the skate park — loose silhouettes carrying an unbothered attitude.'
  },
  'Streetwear': {
    zh: '從街頭文化長出的日常穿著，舒適與態度兼具的 city 感。',
    en: 'Everyday style rooted in street culture — comfort and attitude worn in equal measure.'
  },
  'Urban Contemporary': {
    zh: '融合城市生活步調的當代設計語彙，俐落中帶點都市感。',
    en: 'A contemporary design language shaped by city life — sharp, current, unmistakably urban.'
  }
};
