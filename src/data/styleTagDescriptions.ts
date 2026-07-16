// 45 個風格標籤（對照 src/data/styleLabels.ts 的 STYLE_TAG_ZH）各自的一句話描述，
// 給 Style DNA 結果頁的標籤說明彈窗用。key 必須與 STYLE_TAG_ZH 完全一致。

export interface StyleTagDescription {
  zh: string;
  en: string;
}

export const STYLE_TAG_DESCRIPTIONS: Record<string, StyleTagDescription> = {
  // Future Tech & Digital Psychedelia
  'Cyberpunk': {
    zh: '賽博龐克是一種融合高科技與反烏托邦城市意象，以霓虹燈、機械結構、黑暗街景與強烈色彩對比為核心的視覺風格。',
    en: 'Cyberpunk is a visual style that combines advanced technology with dystopian urban imagery, defined by neon lights, mechanical structures, dark cityscapes, and intense color contrasts.',
  },
  'Digital Psychedelia': {
    zh: '數位迷幻是一種結合迷幻藝術與數位技術，透過流動漸層、扭曲圖形、鮮豔色彩與超現實效果創造感官刺激的視覺風格。',
    en: 'Digital Psychedelia is a visual style that blends psychedelic art with digital technology, using fluid gradients, distorted forms, vivid colors, and surreal effects to create sensory intensity.',
  },
  'Future Tech': {
    zh: '未來科技是一種以先進技術想像為核心，運用金屬材質、發光介面、精密結構與流線造型呈現未來感的視覺風格。',
    en: 'Future Tech is a visual style centered on imagined advanced technology, characterized by metallic materials, illuminated interfaces, precise structures, and streamlined forms.',
  },
  'Futurism': {
    zh: '未來主義是一種強調速度、科技與進步意象，透過動態線條、幾何構成與機械造型表現能量感的設計風格。',
    en: 'Futurism is a design style that emphasizes speed, technology, and progress through dynamic lines, geometric compositions, and machine-inspired forms.',
  },
  'Glitch Art': {
    zh: '故障藝術是一種將數位錯誤轉化為視覺語言，透過畫面錯位、像素破碎、色彩分離與訊號干擾創造不穩定感的藝術風格。',
    en: 'Glitch Art is an artistic style that transforms digital errors into visual language through image displacement, pixel fragmentation, color separation, and signal distortion.',
  },
  'Neo-Tokyo': {
    zh: '新東京風格是一種融合東京都市文化與未來想像，以密集街景、日文標識、霓虹燈光與高科技建築為核心的視覺風格。',
    en: 'Neo-Tokyo is a visual style that blends Tokyo urban culture with futuristic imagination, featuring dense cityscapes, Japanese signage, neon lighting, and high-tech architecture.',
  },
  'Techwear': {
    zh: '機能風是一種結合都市服裝與科技機能，以深色調、多層次剪裁、實用配件與防護材質為核心的設計風格。',
    en: 'Techwear is a design style that combines urban clothing with technical functionality, defined by dark tones, layered silhouettes, utility details, and protective materials.',
  },
  // Y2K & Internet Aesthetics
  'Bubblegum Futurism': {
    zh: '泡泡糖未來主義是一種融合甜美流行文化與未來科技想像，以糖果色、透明材質、圓潤造型與夢幻光澤為核心的視覺風格。',
    en: 'Bubblegum Futurism is a visual style that blends playful pop culture with futuristic imagination, defined by candy colors, transparent materials, rounded forms, and dreamy glossy surfaces.',
  },
  'Chrome Design': {
    zh: '金屬鍍鉻風格是一種以高反射銀色金屬、流線造型與未來科技感為核心的視覺風格。',
    en: 'Chrome Design is a visual style centered on highly reflective silver surfaces, streamlined forms, and a sleek futuristic aesthetic.',
  },
  'Frutiger Aero': {
    zh: '生態科技美學是一種融合自然景觀與數位科技想像，以鮮亮藍綠色、透明介面、水滴質感與清新環境意象為核心的視覺風格。',
    en: 'Frutiger Aero is a visual style that blends natural scenery with optimistic digital technology, characterized by vivid blues and greens, transparent interfaces, water-like textures, and fresh environmental imagery.',
  },
  'McBling': {
    zh: '閃鑽千禧風是一種展現千禧年代奢華流行文化，以水鑽裝飾、金屬光澤、粉紅色調與高調品牌元素為核心的視覺風格。',
    en: 'McBling is a visual style inspired by the glamorous pop culture of the 2000s, defined by rhinestones, metallic shine, pink tones, and bold luxury branding.',
  },
  'Y2K': {
    zh: '千禧年風格是一種源自二十一世紀初科技樂觀想像，以金屬質感、鮮豔色彩、圓潤圖形與早期數位介面為核心的視覺風格。',
    en: 'Y2K is a visual style rooted in early-2000s technological optimism, characterized by metallic textures, vivid colors, rounded graphics, and early digital interface aesthetics.',
  },
  // Decorative & Opulent Art
  'Art Deco': {
    zh: '裝飾藝術是一種融合現代幾何與華麗裝飾，以對稱構圖、金屬光澤、銳利線條與精緻圖案為核心的設計風格。',
    en: 'Art Deco is a design style that combines modern geometry with luxurious ornamentation, defined by symmetry, metallic finishes, sharp lines, and refined patterns.',
  },
  'Baroque': {
    zh: '巴洛克是一種強調戲劇張力與華麗裝飾，以繁複曲線、強烈明暗對比、厚重材質與動態構圖為核心的藝術風格。',
    en: 'Baroque is an artistic style that emphasizes drama and grandeur through elaborate curves, strong light-and-shadow contrasts, rich materials, and dynamic compositions.',
  },
  'Gilded Ornament': {
    zh: '鍍金裝飾是一種以金色表面與精緻紋樣展現奢華感，常透過雕花、浮雕、卷草紋與高反光細節構成視覺焦點。',
    en: 'Gilded Ornament is a decorative style that conveys luxury through golden surfaces, intricate motifs, carved details, relief patterns, and highly reflective accents.',
  },
  'Maximalism': {
    zh: '極繁主義是一種透過大量色彩、圖案、材質與裝飾元素層疊，創造豐富、張揚且充滿個性的設計風格。',
    en: 'Maximalism is a design style that layers abundant colors, patterns, textures, and decorative elements to create a rich, expressive, and highly individual visual experience.',
  },
  'Opulent Classicism': {
    zh: '華麗古典主義是一種結合古典比例與奢華裝飾，以對稱布局、雕刻細節、珍貴材質與莊重氛圍為核心的設計風格。',
    en: 'Opulent Classicism is a design style that combines classical proportions with luxurious decoration, characterized by symmetry, carved details, precious materials, and a grand atmosphere.',
  },
  'Rococo': {
    zh: '洛可可是一種輕盈華麗且富有浪漫氣息的藝術風格，以柔和粉彩、纖細曲線、花卉裝飾與不對稱構圖為核心。',
    en: 'Rococo is a light, ornate, and romantic artistic style defined by soft pastels, delicate curves, floral decoration, and asymmetrical compositions.',
  },
  // Minimal & Structured Modern
  'Minimalism': {
    zh: '極簡主義是一種去除多餘裝飾、強調功能與秩序，以簡潔線條、留白、有限色彩與純粹形體為核心的設計風格。',
    en: 'Minimalism is a design style that removes unnecessary decoration and emphasizes function and order through clean lines, negative space, limited colors, and pure forms.',
  },
  'Modernism': {
    zh: '現代主義是一種重視功能、理性與創新，以簡潔幾何、清晰結構、工業材料與去裝飾化為核心的設計風格。',
    en: 'Modernism is a design style that values function, rationality, and innovation, characterized by simple geometry, clear structures, industrial materials, and minimal ornamentation.',
  },
  'Quiet Luxury': {
    zh: '低調奢華是一種不依賴醒目標誌，透過高品質材質、細膩工藝、中性色調與簡潔剪裁展現精緻感的設計風格。',
    en: 'Quiet Luxury is a design style that expresses refinement without prominent branding, relying on premium materials, subtle craftsmanship, neutral tones, and clean silhouettes.',
  },
  'Scandinavian': {
    zh: '北歐風格是一種重視實用性、舒適感與自然光線，以簡潔造型、淺色木材、柔和色調與溫暖材質為核心的設計風格。',
    en: 'Scandinavian design emphasizes functionality, comfort, and natural light through simple forms, pale woods, soft colors, and warm tactile materials.',
  },
  'Swiss Design': {
    zh: '瑞士設計風格是一種強調資訊清晰與視覺秩序，以網格系統、無襯線字體、不對稱編排與精準留白為核心的平面設計風格。',
    en: 'Swiss Design is a graphic design style focused on clarity and visual order, defined by grid systems, sans-serif typography, asymmetrical layouts, and precise use of negative space.',
  },
  // Earth & Organic Humanism
  'Biophilic Design': {
    zh: '親自然設計是一種將自然元素融入生活空間，透過植物、自然光、有機形態與天然材質強化人與環境連結的設計風格。',
    en: 'Biophilic Design integrates natural elements into built environments through plants, daylight, organic forms, and natural materials to strengthen the connection between people and nature.',
  },
  'Japandi': {
    zh: '北歐侘寂風是一種融合北歐簡約與日式侘寂美學，以克制線條、自然材質、中性色調與手工質感營造寧靜氛圍的設計風格。',
    en: 'Japandi is a design style that combines Scandinavian simplicity with Japanese wabi-sabi, using restrained lines, natural materials, neutral tones, and handcrafted textures to create a calm atmosphere.',
  },
  'Organic Modern': {
    zh: '有機現代風格是一種融合現代簡約線條、自然材質與柔和有機形態，營造溫暖、舒適且貼近自然的設計風格。',
    en: 'Organic Modern is a design style that combines clean modern lines with natural materials and soft organic forms to create a warm, comfortable, and nature-inspired atmosphere.',
  },
  'Wabi-Sabi': {
    zh: '侘寂是一種欣賞不完美、自然痕跡與歲月質感之美，以粗糙材質、不規則形態與低飽和色彩為核心的美學風格。',
    en: 'Wabi-Sabi is an aesthetic that embraces imperfection, natural traces, and the passage of time through raw textures, irregular forms, and muted colors.',
  },
  // Romantic & Pastoral Living
  'Cottagecore': {
    zh: '鄉村田園風格是一種浪漫化自然與傳統鄉村生活，以碎花圖案、手工材質、復古家具與柔和自然色調為核心的視覺風格。',
    en: 'Cottagecore is a visual style that romanticizes nature and traditional rural life through floral patterns, handcrafted materials, vintage furnishings, and soft natural colors.',
  },
  'Grandmillennial': {
    zh: '千禧復古主義是一種由年輕世代重新詮釋傳統居家美學，以印花布料、古典家具、瓷器、荷葉邊與層次裝飾為核心的設計風格。',
    en: 'Grandmillennial is a design style in which younger generations reinterpret traditional interiors through printed fabrics, antique-inspired furniture, porcelain, ruffles, and layered decoration.',
  },
  'Romanticism': {
    zh: '浪漫主義是一種強調情感、想像與自然力量，以戲劇光影、柔美色彩、詩意場景與強烈氛圍為核心的藝術風格。',
    en: 'Romanticism is an artistic style that emphasizes emotion, imagination, and the power of nature through dramatic lighting, expressive colors, poetic scenes, and atmospheric intensity.',
  },
  'Vintage Floral': {
    zh: '復古花卉是一種以古典植物圖鑑與懷舊印花為靈感，透過細緻花朵、柔和褪色色彩與繁複圖案營造浪漫氛圍的視覺風格。',
    en: 'Vintage Floral is a visual style inspired by botanical illustrations and nostalgic prints, using detailed flowers, softly faded colors, and intricate patterns to create a romantic atmosphere.',
  },
  // Retro & Nostalgia
  'Americana': {
    zh: '美式懷舊是一種取材自美國二十世紀大眾文化，以公路意象、復古招牌、紅藍配色、丹寧與鄉村元素為核心的視覺風格。',
    en: 'Americana is a nostalgic visual style rooted in twentieth-century American popular culture, featuring road imagery, vintage signage, red-and-blue palettes, denim, and rural motifs.',
  },
  'Mid-Century Modern': {
    zh: '中世紀現代風是一種興起於二十世紀中期，以簡潔線條、實用機能、溫潤木質與有機幾何造型為核心的設計風格。',
    en: 'Mid-Century Modern is a design style that emerged in the mid-twentieth century, defined by clean lines, practical function, warm wood, and organic geometric forms.',
  },
  'Retro': {
    zh: '摩登復古是一種重新演繹過去年代流行文化，以鮮明配色、幾何圖案、復古字體與懷舊造型為核心的視覺風格。',
    en: 'Retro is a visual style that reinterprets the popular culture of past decades through bold colors, geometric patterns, vintage typography, and nostalgic forms.',
  },
  'Vintage': {
    zh: '時代經典是一種保留特定歷史年代質感，以褪色色彩、歲月痕跡、傳統工藝與真實舊物細節為核心的視覺風格。',
    en: 'Vintage is a visual style that preserves the character of a specific historical period through faded colors, signs of age, traditional craftsmanship, and authentic period details.',
  },
  // Experimental & Avant-Garde
  'Anti-Design': {
    zh: '反設計主義是一種刻意挑戰傳統美感與功能規則，透過衝突配色、混亂編排、失衡構圖與非典型字體創造反秩序感的設計風格。',
    en: 'Anti-Design intentionally challenges conventional beauty and functional rules through clashing colors, chaotic layouts, unbalanced compositions, and unconventional typography.',
  },
  'Avant-Garde': {
    zh: '前衛藝術是一種突破既有形式與文化規範，以實驗手法、非傳統媒材、激進構圖與概念性表達為核心的藝術風格。',
    en: 'Avant-Garde is an artistic style that challenges established forms and cultural conventions through experimentation, unconventional media, radical compositions, and conceptual expression.',
  },
  'Brutalism': {
    zh: '粗獷主義是一種強調裸露結構、原始材質與厚重幾何造型，呈現直接、強烈且不加修飾感的設計風格。',
    en: 'Brutalism is a design style that emphasizes exposed structures, raw materials, and heavy geometric forms, creating a direct, forceful, and deliberately unrefined appearance.',
  },
  'Deconstructivism': {
    zh: '解構主義是一種打破傳統結構與秩序，透過錯位、切割、不對稱與破碎形態創造視覺張力的設計風格。',
    en: 'Deconstructivism is a design style that disrupts traditional structure and order through displacement, fragmentation, asymmetry, and fractured forms.',
  },
  'Experimental Typography': {
    zh: '實驗性字體設計是一種突破文字可讀性與傳統排版規則，透過變形、重疊、拆解與動態編排探索文字表現力的視覺語言。',
    en: 'Experimental Typography is a visual language that challenges conventional readability and layout rules through distortion, layering, fragmentation, and dynamic type arrangements.',
  },
  // Street & Youth Culture
  'Graffiti': {
    zh: '塗鴉藝術是一種源自街頭公共空間，以噴漆字體、自由筆觸、鮮明色彩與個人符號表達態度的視覺風格。',
    en: 'Graffiti is a visual style rooted in public street spaces, using spray-painted lettering, expressive strokes, vivid colors, and personal symbols to communicate identity and attitude.',
  },
  'Hypebeast': {
    zh: '潮流風尚是一種圍繞限量商品與街頭品牌文化形成，以醒目標誌、熱門聯名、大膽圖像與高辨識度單品為核心的視覺風格。',
    en: 'Hypebeast is a visual style shaped by limited releases and street-brand culture, defined by prominent logos, high-profile collaborations, bold graphics, and highly recognizable products.',
  },
  'Skate Culture': {
    zh: '滑板文化是一種源自城市街頭與滑板社群，以磨損材質、貼紙拼貼、手繪圖像與自由叛逆精神為核心的視覺風格。',
    en: 'Skate Culture is a visual style rooted in urban streets and skate communities, characterized by worn textures, sticker collages, hand-drawn graphics, and a free-spirited rebellious attitude.',
  },
  'Streetwear': {
    zh: '街頭穿搭是一種融合青年次文化、運動服飾與都市生活，以寬鬆輪廓、圖像印花、層次搭配與醒目配件為核心的服裝風格。',
    en: 'Streetwear is a fashion style that blends youth subcultures, sportswear, and urban life through relaxed silhouettes, graphic prints, layered styling, and statement accessories.',
  },
  'Urban Contemporary': {
    zh: '都會當代是一種融合現代城市感、俐落線條與潮流文化，以混凝土材質、中性色調、圖像藝術與精緻街頭元素為核心的設計風格。',
    en: 'Urban Contemporary is a design style that combines modern city life, clean lines, and current culture through concrete textures, neutral colors, graphic art, and refined street influences.',
  },
};
