import { describe, it, expect } from 'vitest';
import { buildImageRow } from '../../../scripts/enrich/buildImageRow';
import type { ClassificationResult } from '../../../scripts/enrich/classify';

const classification: ClassificationResult = {
  styleGroup: 'Y2K & Internet Aesthetics',
  medium: 'Graphic Design',
  subMedium: 'Poster Design',
  style: ['Y2K', 'Chrome Design'],
  confidence: { styleGroup: 0.31, medium: 0.28, subMedium: 0.19 },
  needsReview: { styleGroup: false, medium: false, subMedium: true }
};

describe('buildImageRow', () => {
  it('組出對齊 images 表 schema 的 row 物件', () => {
    const row = buildImageRow(classification, ['#8EC9FF', '#B9A8F3'], {
      source: 'pexels',
      externalId: '12345',
      url: 'https://images.pexels.com/photos/12345.jpg',
      description: 'shiny chrome bubble',
      photographer: 'Jane Doe'
    });

    expect(row.id).toBe('ext-pexels-12345');
    expect(row.title).toBe('shiny chrome bubble');
    expect(row.attribution).toBe('Photo by Jane Doe / Pexels');
    expect(row.style_group).toBe('Y2K & Internet Aesthetics');
    expect(row.sub_medium).toBe('Poster Design');
    expect(row.color_palette).toEqual(['#8EC9FF', '#B9A8F3']);
    expect(row.needs_review.subMedium).toBe(true);
  });

  it('description 為空時用 styleGroup 組預設 title', () => {
    const row = buildImageRow({ ...classification, subMedium: 'Editorial Design' }, [], {
      source: 'unsplash',
      externalId: '1',
      url: 'u',
      description: '',
      photographer: 'P'
    });

    expect(row.title).toBe('Y2K & Internet Aesthetics inspiration');
    expect(row.sub_medium).toBe('Editorial Design');
    expect(row.attribution).toBe('Photo by P / Unsplash');
  });
});
