import { describe, expect, it } from 'vitest';
import { assertNotPlaceholderInProduction } from '@/data/styleGroupAnchorEmbeddings';

describe('assertNotPlaceholderInProduction', () => {
  it('正式環境丟錯，避免佔位向量流進生產環境', () => {
    expect(() => assertNotPlaceholderInProduction(true)).toThrow('Placeholder embedding detected');
  });

  it('非正式環境（開發/測試）不丟錯', () => {
    expect(() => assertNotPlaceholderInProduction(false)).not.toThrow();
  });
});
