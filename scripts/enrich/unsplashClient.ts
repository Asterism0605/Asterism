import type { GalleryMeta } from './galleryMeta';

const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

interface UnsplashPhoto {
  id: string;
  alt_description: string | null;
  user: { name: string };
  urls: { regular: string };
}

// 需要環境變數 UNSPLASH_ACCESS_KEY（Unsplash Developers 免費申請）。
export async function searchUnsplash(query: string, perPage = 15): Promise<GalleryMeta[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY 未設定');
  }

  const url = `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` }
  });
  if (!response.ok) {
    throw new Error(`Unsplash API 失敗：${response.status}`);
  }

  const data = (await response.json()) as { results: UnsplashPhoto[] };
  return data.results.map((photo) => ({
    source: 'unsplash' as const,
    externalId: photo.id,
    url: photo.urls.regular,
    description: photo.alt_description ?? '',
    photographer: photo.user.name
  }));
}
