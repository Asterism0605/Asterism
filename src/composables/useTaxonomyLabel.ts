import { useI18n } from 'vue-i18n';
import { MEDIUM_ZH, STYLE_TAG_ZH, SUB_MEDIUM_EN, SUB_MEDIUM_ZH } from '@/data/styleLabels';

// medium / sub-medium 依語言顯示（zh 查對照表、en 回原文）。
// 查無對照 → 回原值英文，所以混用的 label 也安全。
// 例外：Outfit 的 "...Focus" 抓圖標籤，en 也要透過 SUB_MEDIUM_EN 拿掉 Focus（issue #137）。
export function useTaxonomyLabel() {
  const { locale } = useI18n();

  const localizeTaxon = (value?: string | null): string => {
    if (!value) return '';
    if (locale.value !== 'zh') return SUB_MEDIUM_EN[value] ?? value;
    return MEDIUM_ZH[value] ?? SUB_MEDIUM_ZH[value] ?? STYLE_TAG_ZH[value] ?? value;
  };

  return { localizeTaxon };
}
