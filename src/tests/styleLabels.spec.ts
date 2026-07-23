import { describe, expect, it } from 'vitest';
import styleData from '@/data/style-data.json';
import {
  STYLE_TAG_ALIAS,
  STYLE_TAG_ZH,
  SUB_MEDIUM_EN,
  SUB_MEDIUM_ZH,
  SUB_MEDIUMS_BY_MEDIUM,
  styleTagZh
} from '@/data/styleLabels';

describe('styleLabels', () => {
  it('covers every theme tag currently used by image data', () => {
    const tags = Array.from(new Set(styleData.flatMap((image) => image.style ?? [])));
    const missingTags = tags.filter((tag) => !STYLE_TAG_ZH[tag]);

    expect(missingTags).toEqual([]);
  });

  it('將外部圖片的同義 theme tag 正規化後顯示既有中文翻譯', () => {
    for (const [alias, canonical] of Object.entries(STYLE_TAG_ALIAS)) {
      expect(styleTagZh(alias)).toBe(STYLE_TAG_ZH[canonical]);
    }
  });

  it('涵蓋外部圖片新增、沒有既有同義 tag 的主題標籤', () => {
    expect(styleTagZh('Digital Psychedelia')).toBe('數位迷幻');
    expect(styleTagZh('Future Tech')).toBe('未來科技');
    expect(styleTagZh('Gilded Ornament')).toBe('鍍金裝飾');
    expect(styleTagZh('Opulent Classicism')).toBe('華麗古典主義');
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
