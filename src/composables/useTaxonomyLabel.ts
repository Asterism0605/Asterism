import { useI18n } from 'vue-i18n';
import { MEDIUM_ZH, SUB_MEDIUM_ZH } from '@/data/styleLabels';

// medium / sub-medium 依語言顯示（zh 查對照表、en 回原文）。
// 風格名（Baroque…）等查無對照 → 回原值英文，所以混用的 label 也安全。
export function useTaxonomyLabel() {
  const { locale } = useI18n();

  const localizeTaxon = (value?: string | null): string => {
    if (!value) return '';
    if (locale.value !== 'zh') return value;
    return MEDIUM_ZH[value] ?? SUB_MEDIUM_ZH[value] ?? value;
  };

  return { localizeTaxon };
}
