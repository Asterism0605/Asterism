// src/data/styleGroupAnchorEmbeddings.ts
// 9 個 styleGroup 錨點文字的 CLIP embedding。必須跟後端補 embedding 用的同一顆 model
// （見 IMAGE_SEARCH_CONFIG.clipModelId）、同樣的抽取方式算出，向量空間才會一致。
//
// ponytail: 目前是佔位向量（用公式生成，非真實 CLIP 輸出），待後端 embedding 補跑計畫完成、
// 算出 9 組錨點文字（asterism-backend scripts/enrich/taxonomy.ts 的 STYLE_GROUP_ANCHORS）的
// 真實 embedding 後，整包替換這個陣列（維度需維持 IMAGE_SEARCH_CONFIG.embeddingDimension）。
//
// 安全閥：正式環境如果還沒替換掉這個佔位資料，啟動時直接丟錯讓功能整個掛掉，避免忘記替換、
// styleGroup 分類全部基於假資料卻沒有任何錯誤訊號。替換成真實資料時，這段連同
// placeholderVector() 一起刪掉即可，不用另外記得關閉旗標。
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

export function assertNotPlaceholderInProduction(isProd: boolean): void {
  if (isProd) {
    throw new Error(
      'Placeholder embedding detected: src/data/styleGroupAnchorEmbeddings.ts 還是佔位向量，' +
        '正式環境不能用假資料做 styleGroup 分類。請在後端算出真實 embedding 後整包替換這個檔案再部署。'
    );
  }
}

assertNotPlaceholderInProduction(import.meta.env.PROD);

export interface StyleGroupAnchor {
  styleGroup: string;
  embedding: number[];
}

function placeholderVector(seed: number): number[] {
  return Array.from(
    { length: IMAGE_SEARCH_CONFIG.embeddingDimension },
    (_, i) => Math.sin(seed * (i + 1))
  );
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
