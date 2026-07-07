import { describe, expect, it } from 'vitest';
import styleData from '@/data/style-data.json';
import { STYLE_TAG_ZH } from '@/data/styleLabels';

describe('styleLabels', () => {
  it('covers every theme tag currently used by image data', () => {
    const tags = Array.from(new Set(styleData.flatMap((image) => image.style ?? [])));
    const missingTags = tags.filter((tag) => !STYLE_TAG_ZH[tag]);

    expect(missingTags).toEqual([]);
  });
});
