const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function graphemeLength(value: string): number {
  return Array.from(segmenter.segment(value)).length;
}
