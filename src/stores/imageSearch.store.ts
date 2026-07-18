import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n } from '@/i18n';
import { domainGateScore, isRejected, isWeakMatch, rerankByStyle, validateImageFile } from '@/services/imageSearch.service';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import { searchSimilarImages } from '@/api/imageSearch.api';
import { fetchClassificationAnchors, type ClassificationAnchor } from '@/api/classificationAnchors.api';
import { useClipModelStore } from '@/stores/clipModel.store';
import type { ImageSearchResult } from '@/types/imageSearch';

export type ImageSearchStatus = 'idle' | 'searching' | 'success' | 'no-match' | 'error';

// Pinia store，理由同 clipModel.store：使用者從搜尋結果點進詳情頁再按返回時，
// ImageSearch 頁面會被卸載又重新掛載，搜尋結果不該憑空消失。
export const useImageSearchStore = defineStore('image-search', () => {
  const status = ref<ImageSearchStatus>('idle');
  const results = ref<ImageSearchResult[]>([]);
  const error = ref<string | null>(null);
  // Domain Gate 過了、但檢索 top-1 分數普通 → UI 顯示「相似度中等」提示，誠實管理期望。
  const weakMatch = ref(false);
  // 36 個 gate anchor / 9 個 styleGroup anchor 每次 search 都一樣，只抓一次、之後重用（store 生命週期內快取）。
  const gateAnchors = ref<ClassificationAnchor[] | null>(null);
  const styleAnchors = ref<ClassificationAnchor[] | null>(null);

  async function search(file: File) {
    if (status.value === 'searching') return;

    const validationError = validateImageFile(file);
    if (validationError) {
      status.value = 'error';
      error.value = validationError;
      return;
    }

    status.value = 'searching';
    error.value = null;
    results.value = [];
    weakMatch.value = false;

    try {
      const clipModelStore = useClipModelStore();
      const [embedding, anchors, styleAnchorList] = await Promise.all([
        clipModelStore.computeEmbedding(file),
        gateAnchors.value ?? fetchClassificationAnchors('gate'),
        styleAnchors.value ?? fetchClassificationAnchors('styleGroup')
      ]);

      // 錨點空陣列代表 DB 沒資料（部署漏跑 anchor 腳本之類的設定問題），要走 error
      // 讓人知道壞了；不能放行到 domainGateScore——Math.max(...[]) 是 -Infinity，
      // 會把所有查詢誤判成 no-match，看起來像「圖庫沒有像的圖」而不是系統故障。
      if (anchors.length === 0 || styleAnchorList.length === 0) {
        throw new Error('classification anchors unavailable');
      }

      gateAnchors.value = anchors;
      styleAnchors.value = styleAnchorList;

      // Domain Gate 先判斷「是不是設計圖」——不是的話沒必要再打檢索 RPC。
      if (isRejected(domainGateScore(embedding, anchors))) {
        status.value = 'no-match';
        return;
      }

      // 全庫 kNN：Domain Gate 過了，圖庫裡「最像的」一定給，不再用相似度擋掉結果
      // （相似度普通時交給下面的 weakMatch 提示，而不是整批不顯示）。
      // 候選拉 rerankCandidateCount 名再做風格軟加權重排，視覺相似度是骨幹、風格是加權。
      const matches = await searchSimilarImages(embedding, IMAGE_SEARCH_CONFIG.rerankCandidateCount);

      if (matches.length === 0) {
        status.value = 'no-match';
        return;
      }

      // weakMatch 看重排前的 kNN top-1：它才代表「圖庫裡最像的有多像」。
      weakMatch.value = isWeakMatch(matches[0].similarity);
      results.value = rerankByStyle(embedding, matches, styleAnchorList);
      status.value = 'success';
    } catch (e) {
      console.warn('[imageSearch] search failed:', e);
      status.value = 'error';
      error.value = i18n.global.t('imageSearch.searchFailed');
    }
  }

  // 使用者換了上傳檔案時清掉上一輪的結果——不清的話中央預覽已換成新圖、
  // 衛星卡片還是舊圖的搜尋結果，看起來像新圖的結果，會誤導。
  function reset() {
    if (status.value === 'searching') return;
    status.value = 'idle';
    results.value = [];
    error.value = null;
    weakMatch.value = false;
  }

  return { status, results, error, weakMatch, search, reset };
});
