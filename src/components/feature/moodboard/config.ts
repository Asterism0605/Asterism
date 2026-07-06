import type {
  MoodboardHomePhoto,
  MoodboardOrbitParams,
  MoodboardPhoto,
  SavedImage
} from '@/types/moodboard';

export const NAV_H = 64;
export const INNER_K = 0.9;
export const ORBIT_SPEED = (Math.PI * 2) / 60;
export const SPRITE_RADIUS = 2.2;
export const MAX_FOLDERS = 10;
export const DETAIL_CAP = 20;

export const HO: MoodboardOrbitParams = {
  cx: 980,
  cy: 550,
  rx: 500,
  ry: 500,
  node: { x: 1350, y: 40 }
};

export const MW = 440;
export const MH = 956;

export const M_HOME_ORBIT: MoodboardOrbitParams = {
  cx: 220,
  cy: 770,
  rx: 597,
  ry: 597,
  node: { x: 470, y: 230 }
};
export const M_DETAIL_ORBIT: MoodboardOrbitParams = {
  cx: 220,
  cy: 770,
  rx: 597,
  ry: 597,
  node: { x: 470, y: 230 }
};

export const folderNames: string[] = [
  'Project Title',
  'Editorial 02',
  'Texture Study',
  'Runway SS',
  'Interiors',
  'Palette',
  'Archive',
  'Studio Day',
  'Lookbook',
  'Muse'
];

export const photos: MoodboardPhoto[] = [
  { src: '/images/image1.png', w: 120, h: 96 },
  { src: '/images/image2.png', w: 112, h: 150 },
  { src: '/images/image3.png', w: 100, h: 140 },
  { src: '/images/image4.png', w: 132, h: 100 },
  { src: '/images/image5.png', w: 150, h: 150 },
  { src: '/images/image1.png', w: 110, h: 130 },
  { src: '/images/image2.png', w: 140, h: 108 },
  { src: '/images/image3.png', w: 118, h: 148 },
  { src: '/images/image4.png', w: 148, h: 112 },
  { src: '/images/image5.png', w: 104, h: 138 },
  { src: '/images/image1.png', w: 128, h: 100 },
  { src: '/images/image2.png', w: 114, h: 146 },
  { src: '/images/image3.png', w: 142, h: 110 },
  { src: '/images/image4.png', w: 100, h: 128 },
  { src: '/images/image5.png', w: 148, h: 130 },
  { src: '/images/image1.png', w: 112, h: 142 },
  { src: '/images/image2.png', w: 134, h: 100 },
  { src: '/images/image3.png', w: 98, h: 138 },
  { src: '/images/image4.png', w: 146, h: 116 },
  { src: '/images/image5.png', w: 120, h: 148 }
];

export const IMG_URLS: string[] = photos.map((p) => p.src);
export const EMPTY_STATE_PREVIEW_PHOTOS: MoodboardPhoto[] = photos;

export interface MoodboardOrbitImage {
  id: string;
  src: string;
  isPlaceholder: boolean;
}

export function buildMoodboardOrbitImages(savedImages: SavedImage[]): MoodboardOrbitImage[] {
  if (savedImages.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const uniqueImages = savedImages.filter((image) => {
    if (seen.has(image.id)) return false;
    seen.add(image.id);
    return true;
  });
  const realImages = uniqueImages.map((image) => ({
    id: image.id,
    src: image.src,
    isPlaceholder: false
  }));

  if (uniqueImages.length >= 20) {
    return realImages;
  }

  const placeholders = Array.from({ length: 20 - uniqueImages.length }, (_, index) => ({
    id: `placeholder-${index}`,
    src: photos[index % photos.length].src,
    isPlaceholder: true
  }));

  return [...realImages, ...placeholders];
}

const mImg = (n: number) => `/images/image${n}.png`;

export const mDetailBase: MoodboardPhoto[] = [
  { src: mImg(4), w: 58, h: 66 },
  { src: mImg(5), w: 116, h: 136 },
  { src: mImg(3), w: 48, h: 74 },
  { src: mImg(2), w: 84, h: 104 },
  { src: mImg(3), w: 50, h: 78 },
  { src: mImg(1), w: 66, h: 72 },
  { src: mImg(5), w: 104, h: 92 },
  { src: mImg(2), w: 74, h: 92 },
  { src: mImg(4), w: 62, h: 56 },
  { src: mImg(1), w: 70, h: 84 }
];

export const mHomePhotos: MoodboardHomePhoto[] = [
  { id: 'h0', src: mImg(4), cx: 140, cy: 447, w: 52, h: 52 },
  { id: 'h1', src: mImg(5), cx: 313, cy: 517, w: 108, h: 130 },
  { id: 'h2', src: mImg(2), cx: 80, cy: 614, w: 80, h: 96 },
  { id: 'h3', src: mImg(3), cx: 217, cy: 656, w: 44, h: 52, faded: true },
  { id: 'h4', src: mImg(1), cx: 128, cy: 785, w: 58, h: 64 },
  { id: 'h5', src: mImg(5), cx: 294, cy: 853, w: 104, h: 96 }
];
