import { Vibrant } from 'node-vibrant/node';

// 取主色 → hex 陣列，依族群人口數由多到少。
export async function extractPalette(imageRef: string, max = 3): Promise<string[]> {
  const palette = await Vibrant.from(imageRef).getPalette();

  return Object.values(palette)
    .filter((swatch): swatch is NonNullable<typeof swatch> => swatch !== null)
    .sort((a, b) => b.population - a.population)
    .slice(0, max)
    .map((swatch) => swatch.hex);
}
