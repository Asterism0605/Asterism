import { describe, expect, it } from 'vitest';
import styleData from '@/data/style-data.json';
import {
  STYLE_TAG_ZH,
  SUB_MEDIUM_EN,
  SUB_MEDIUM_ZH,
  SUB_MEDIUMS_BY_MEDIUM
} from '@/data/styleLabels';

describe('styleLabels', () => {
  it('covers every theme tag currently used by image data', () => {
    const tags = Array.from(new Set(styleData.flatMap((image) => image.style ?? [])));
    const missingTags = tags.filter((tag) => !STYLE_TAG_ZH[tag]);

    expect(missingTags).toEqual([]);
  });

  it('每個新 subMedium 標籤都有中文對照', () => {
    const missing = Object.values(SUB_MEDIUMS_BY_MEDIUM)
      .flat()
      .filter((label) => !SUB_MEDIUM_ZH[label]);

    expect(missing).toEqual([]);
  });

  // issue #137：Outfit 的 "...Focus" 只用於抓圖分類，前端顯示（中英）都不能出現 Focus。
  it('前端顯示不出現 Focus（中英兩種語言）', () => {
    for (const label of SUB_MEDIUMS_BY_MEDIUM.Outfit) {
      const zh = SUB_MEDIUM_ZH[label] ?? label;
      const en = SUB_MEDIUM_EN[label] ?? label;
      expect(zh).not.toMatch(/focus/i);
      expect(en).not.toMatch(/focus/i);
    }
  });
});
