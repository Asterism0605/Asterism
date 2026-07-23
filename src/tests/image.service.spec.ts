import { describe, expect, it } from 'vitest';
import rawStyleImages from '@/data/style-data.json';
import {
  getHomeInspirationImages,
  getImageById,
  getMediumGroupImages,
  getRelatedImages,
  getSourceLinkInfo,
  getSubMediumGroupImages,
  resolvePhotographerInfo
} from '@/services/image.service';

function getMaxConsecutiveStyleGroupCount(styleGroups: string[]): number {
  return styleGroups.reduce(
    (maxCount, styleGroup, index) => {
      const currentCount =
        index > 0 && styleGroup === styleGroups[index - 1] ? maxCount.current + 1 : 1;

      return {
        current: currentCount,
        max: Math.max(maxCount.max, currentCount)
      };
    },
    { current: 0, max: 0 }
  ).max;
}

function expectNoAdjacentMainImagesInSameStyleGroup(
  images: Awaited<ReturnType<typeof getHomeInspirationImages>>
): void {
  for (let index = 1; index < images.length; index += 1) {
    const previousImage = images[index - 1];
    const currentImage = images[index];

    if (previousImage.styleGroup !== currentImage.styleGroup) continue;

    expect(previousImage.id.includes('main') && currentImage.id.includes('main')).toBe(false);
  }
}

function getSameStyleGroupPairTypes(
  images: Awaited<ReturnType<typeof getHomeInspirationImages>>
): string[] {
  const pairTypes: string[] = [];

  for (let index = 0; index < images.length - 1; index += 1) {
    const firstImage = images[index];
    const secondImage = images[index + 1];

    if (firstImage.styleGroup !== secondImage.styleGroup) continue;

    const firstType = firstImage.id.includes('concept') ? 'concept' : 'main';
    const secondType = secondImage.id.includes('concept') ? 'concept' : 'main';
    pairTypes.push(`${firstType}+${secondType}`);
    index += 1;
  }

  return pairTypes;
}

function expectHomePairCadence(
  images: Awaited<ReturnType<typeof getHomeInspirationImages>>
): void {
  const pairTypes = getSameStyleGroupPairTypes(images);
  let conceptPairCount = 0;
  let requiredConceptPairs = 3;

  expect(pairTypes.slice(0, 7)).toEqual([
    'concept+concept',
    'concept+concept',
    'concept+concept',
    'concept+main',
    'concept+concept',
    'concept+concept',
    'concept+main'
  ]);

  for (const pairType of pairTypes) {
    if (pairType === 'concept+concept') {
      conceptPairCount += 1;
      continue;
    }

    expect(pairType).toBe('concept+main');
    expect(conceptPairCount).toBeGreaterThanOrEqual(requiredConceptPairs);
    conceptPairCount = 0;
    requiredConceptPairs = 2;
  }
}

describe('image.service', () => {
  it('keeps every style tag within a single style group', () => {
    const styleGroupsByStyle = new Map<string, Set<string>>();

    for (const image of rawStyleImages) {
      for (const style of image.style) {
        const styleGroups = styleGroupsByStyle.get(style) ?? new Set<string>();
        styleGroups.add(image.styleGroup);
        styleGroupsByStyle.set(style, styleGroups);
      }
    }

    const crossGroupStyles = [...styleGroupsByStyle.entries()]
      .filter(([, styleGroups]) => styleGroups.size > 1)
      .map(([style, styleGroups]) => ({ style, styleGroups: [...styleGroups] }));

    expect(crossGroupStyles).toEqual([]);
  });

  it('finds an image by id and returns undefined for unknown ids', () => {
    expect(getImageById('y2k-main-001')?.id).toBe('y2k-main-001');
    expect(getImageById('missing-image')).toBeUndefined();
  });

  describe('resolvePhotographerInfo', () => {
    it('本地圖（attribution 是 Asterism 或沒帶欄位）回傳站徽當頭像', () => {
      expect(resolvePhotographerInfo('Asterism')).toEqual({
        name: 'Asterism',
        avatarUrl: '/sitelogo.png'
      });
      expect(resolvePhotographerInfo(undefined)).toEqual({
        name: 'Asterism',
        avatarUrl: '/sitelogo.png'
      });
    });

    it('外部圖從 "Photo by {攝影師} / {來源}" 解析出攝影師姓名，不給頭像', () => {
      expect(resolvePhotographerInfo('Photo by Mikhail Nilov / Pexels')).toEqual({
        name: 'Mikhail Nilov',
        avatarUrl: undefined
      });
      expect(resolvePhotographerInfo('Photo by Miguel Bruna / Unsplash')).toEqual({
        name: 'Miguel Bruna',
        avatarUrl: undefined
      });
    });

    it('格式不符預期時，原樣顯示整段 attribution 字串當後備', () => {
      expect(resolvePhotographerInfo('Unexpected format')).toEqual({
        name: 'Unexpected format',
        avatarUrl: undefined
      });
    });
  });

  describe('getSourceLinkInfo', () => {
    it('http/https 網址回傳驗證過的 url 與只取網域的 label', () => {
      expect(getSourceLinkInfo('https://unsplash.com/photos/abc123')).toEqual({
        url: 'https://unsplash.com/photos/abc123',
        label: 'unsplash.com'
      });
      expect(getSourceLinkInfo('https://www.pexels.com/photo/xxxx-1234567/')).toEqual({
        url: 'https://www.pexels.com/photo/xxxx-1234567/',
        label: 'www.pexels.com'
      });
    });

    it('沒有 sourceUrl（本地/Asterism 自製圖）回傳 undefined', () => {
      expect(getSourceLinkInfo(undefined)).toBeUndefined();
    });

    it('不是合法網址時回傳 undefined，不丟例外', () => {
      expect(getSourceLinkInfo('not a url')).toBeUndefined();
    });

    it('危險協議（javascript:/data:/mailto:）一律回傳 undefined，不讓 href 拿去用', () => {
      expect(getSourceLinkInfo('javascript:alert(1)')).toBeUndefined();
      expect(getSourceLinkInfo('data:text/html,<script>alert(1)</script>')).toBeUndefined();
      expect(getSourceLinkInfo('mailto:test@example.com')).toBeUndefined();
    });
  });

  it('returns local concept images (no medium) across every style group for the home page', async () => {
    const images = await getHomeInspirationImages();
    const styleGroups = images.map((image) => image.styleGroup);

    expect(images).toHaveLength(108);
    expect(new Set(styleGroups).size).toBe(9);
    expect(images[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        src: expect.stringContaining('/style-image/'),
        alt: expect.any(String),
        styleGroup: expect.any(String)
      })
    );
  });

  it('serves 480w/720w preview thumbnails with srcset for home concept images (#181)', async () => {
    const images = await getHomeInspirationImages();

    // 打包資料的概念圖都在 preview 白名單內，應全數改用縮圖。
    expect(
      images.every((image) => image.src.startsWith('/style-image/preview/'))
    ).toBe(true);
    expect(images[0].src).toMatch(/\/style-image\/preview\/.+-480\.webp$/);
    expect(images[0].srcset).toMatch(/-480\.webp 480w, .+-720\.webp 720w$/);
    // width/height 供 <img> 預留比例消 CLS。
    expect(images[0].width).toBeGreaterThan(0);
    expect(images[0].height).toBeGreaterThan(0);
  });

  it('preserves the default home inspiration order without preferred styles', async () => {
    const defaultImages = await getHomeInspirationImages();
    const emptyPreferenceImages = await getHomeInspirationImages({ preferredStyles: [] });

    expect(emptyPreferenceImages.map((image) => image.id)).toEqual(
      defaultImages.map((image) => image.id)
    );
  });

  it('interleaves home inspiration images with at most two adjacent images per style group', async () => {
    const images = await getHomeInspirationImages();
    const styleGroups = images.map((image) => image.styleGroup);

    expect(new Set(styleGroups.slice(0, 18)).size).toBe(9);
    expect(getMaxConsecutiveStyleGroupCount(styleGroups)).toBeLessThanOrEqual(2);
    expectNoAdjacentMainImagesInSameStyleGroup(images);
    expectHomePairCadence(images);
  });

  it('puts 12 images from the top Style DNA tag group first, then restores interleaving', async () => {
    const images = await getHomeInspirationImages({
      preferredStyles: ['Y2K', 'Art Deco']
    });
    const styleGroups = images.map((image) => image.styleGroup);
    const primaryStyleGroup = 'Y2K & Internet Aesthetics';

    expect(images[0]).toEqual(
      expect.objectContaining({
        id: 'y2k-main-001',
        styleGroup: primaryStyleGroup
      })
    );
    expect(styleGroups.slice(0, 12)).toEqual(Array(12).fill(primaryStyleGroup));
    expect(styleGroups[12]).not.toBe(primaryStyleGroup);
    expect(getMaxConsecutiveStyleGroupCount(styleGroups.slice(12))).toBeLessThanOrEqual(2);
    expectNoAdjacentMainImagesInSameStyleGroup(images);
    expectHomePairCadence(images.slice(12));
  });

  describe('getMediumGroupImages', () => {
    it('returns one image per medium in the same style group', () => {
      const images = getMediumGroupImages('y2k-main-001');

      expect(images).toHaveLength(4);
      expect(images.map((image) => image.medium).sort()).toEqual([
        'Architecture',
        'Graphic Design',
        'Interior Design',
        'Outfit'
      ]);
    });

    it('excludes current and visited images, keeping the medium via another image', () => {
      // y2k-graphic-001 是 Graphic Design 的入口圖；排除它後該 medium 仍有其他圖，
      // 應換一張代表、而非讓整個 Graphic Design 消失。
      const images = getMediumGroupImages('y2k-main-001', {
        visitedImageIds: ['y2k-graphic-001']
      });

      expect(images).toHaveLength(4);
      expect(images.map((image) => image.medium).sort()).toEqual([
        'Architecture',
        'Graphic Design',
        'Interior Design',
        'Outfit'
      ]);
      expect(images.map((image) => image.id)).not.toContain('y2k-graphic-001');
      expect(images.find((image) => image.medium === 'Graphic Design')?.subMedium).toBeTruthy();
    });

    it('prefers medium-only representatives even when rng would otherwise pick subMedium images', () => {
      const lowest = getMediumGroupImages('y2k-main-001', { rng: () => 0 });
      expect(lowest.find((image) => image.medium === 'Graphic Design')?.id).toBe('y2k-graphic-001');

      const highest = getMediumGroupImages('y2k-main-001', { rng: () => 0.999 });
      expect(highest.find((image) => image.medium === 'Graphic Design')?.id).toBe(
        'y2k-graphic-001'
      );
      expect(highest.every((image) => !image.subMedium)).toBe(true);
    });

    it('clamps to the last candidate when rng returns 1', () => {
      // 防呆：注入的 rng 回傳 1（floor(1*len)=len）不得越界成 undefined。
      const images = getMediumGroupImages('y2k-main-001', { rng: () => 1 });

      expect(images).toHaveLength(4);
      expect(images.find((image) => image.medium === 'Graphic Design')?.id).toBe('y2k-graphic-001');
      expect(images.every((image) => !image.subMedium)).toBe(true);
    });
  });

  describe('getSubMediumGroupImages', () => {
    it('returns one image per subMedium within the same medium', () => {
      const images = getSubMediumGroupImages('y2k-graphic-001');

      expect(images).toHaveLength(4);
      expect(images.every((image) => image.medium === 'Graphic Design')).toBe(true);
      expect(images.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(true);
    });

    it('returns empty array when image has no medium', () => {
      const images = getSubMediumGroupImages('y2k-main-001');

      expect(images).toHaveLength(0);
    });

    it('does not return the center image when it is the only representative in its subMedium group', () => {
      const images = getSubMediumGroupImages('ftdp-outfit-top-001', {
        visitedImageIds: ['y2k-main-001'],
        rng: () => 0
      });

      expect(images.map((image) => image.subMedium).sort()).toEqual([
        'Accessory Focus',
        'Bottom Focus',
        'Dress Focus'
      ]);
      expect(images.map((image) => image.id)).not.toContain('ftdp-outfit-top-001');
    });

    it('does not recommend eag-interior-chair-001 to itself', () => {
      const images = getSubMediumGroupImages('eag-interior-chair-001', {
        visitedImageIds: ['ext-pexels-15207412'],
        rng: () => 0
      });

      expect(images.map((image) => image.id)).not.toContain('eag-interior-chair-001');
    });
  });

  describe('getRelatedImages', () => {
    it('returns related images from the same style group without current or visited images', () => {
      const relatedImages = getRelatedImages('y2k-main-001', {
        visitedImageIds: ['y2k-graphic-001']
      });

      expect(relatedImages).toHaveLength(4);
      expect(relatedImages.map((image) => image.id)).not.toContain('y2k-main-001');
      expect(relatedImages.map((image) => image.id)).not.toContain('y2k-graphic-001');
      expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
        true
      );
      expect(relatedImages.every((image) => image.subMedium)).toBe(true);
    });

    it('does not fill related images from another style group', () => {
      const relatedImages = getRelatedImages('y2k-main-001', {
        limit: 100
      });

      expect(relatedImages).toHaveLength(56);
      expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
        true
      );
      expect(relatedImages.every((image) => image.subMedium)).toBe(true);
    });

    it('uses the same style group as the primary recommendation signal', () => {
      const images = getRelatedImages('ftdp-graphic-001');

      expect(images.length).toBeGreaterThan(0);
      expect(
        images.every((image) => image.styleGroup === 'Future Tech & Digital Psychedelia')
      ).toBe(true);
      expect(images.every((image) => image.subMedium)).toBe(true);
      expect(images.some((image) => image.medium !== 'Graphic Design')).toBe(true);
    });
  });
});
