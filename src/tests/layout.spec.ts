import { describe, expect, it } from 'vitest';
import { packPhotos } from '@/components/feature/moodboard/layout';

describe('packPhotos', () => {
  it('preserves the placeholder flag independently of the faded flag', () => {
    const nodes = packPhotos(
      [
        { src: '/a.webp', w: 80, h: 80, placeholder: true },
        { src: '/b.webp', w: 80, h: 80, placeholder: false },
        { src: '/c.webp', w: 80, h: 80 },
        { src: '/d.webp', w: 80, h: 80, faded: true, placeholder: false }
      ],
      { cx: 200, cy: 200, rx: 180, ry: 180 }
    );

    expect(nodes.map((n) => n.placeholder)).toEqual([true, false, undefined, false]);
    expect(nodes[3].faded).toBe(true);
    expect(nodes[3].placeholder).toBe(false);
  });
});
