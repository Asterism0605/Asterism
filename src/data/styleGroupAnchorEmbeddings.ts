// src/data/styleGroupAnchorEmbeddings.ts
// 9 個 styleGroup 錨點文字的 CLIP embedding。必須跟後端補 embedding 用的同一顆 model
// （Xenova/clip-vit-base-patch32）、同樣的抽取方式算出，向量空間才會一致。
//
// ponytail: 目前是佔位向量（用公式生成，非真實 CLIP 輸出），待後端 embedding 補跑計畫完成、
// 算出 9 組錨點文字（asterism-backend scripts/enrich/taxonomy.ts 的 STYLE_GROUP_ANCHORS）的
// 真實 embedding 後，整包替換這個陣列（維度需維持 512）。
export interface StyleGroupAnchor {
  styleGroup: string;
  embedding: number[];
}

const EMBEDDING_DIMENSION = 512;

function placeholderVector(seed: number): number[] {
  return Array.from({ length: EMBEDDING_DIMENSION }, (_, i) => Math.sin(seed * (i + 1)));
}

const STYLE_GROUPS = [
  'Future Tech & Digital Psychedelia',
  'Y2K & Internet Aesthetics',
  'Decorative & Opulent Art',
  'Minimal & Structured Modern',
  'Earth & Organic Humanism',
  'Romantic & Pastoral Living',
  'Retro & Nostalgia',
  'Experimental & Avant-Garde',
  'Street & Youth Culture'
] as const;

export const STYLE_GROUP_ANCHOR_EMBEDDINGS: StyleGroupAnchor[] = STYLE_GROUPS.map(
  (styleGroup, index) => ({ styleGroup, embedding: placeholderVector(index + 1) })
);
