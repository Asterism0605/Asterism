import { useI18n } from 'vue-i18n';
import { styleTagZh } from '@/data/styleLabels';

// style tag 依語言顯示（zh 查對照表、en 回原文；查無對照一律 fallback 回原文）。
export function useStyleTagLabel() {
  const { locale } = useI18n();

  const displayLabel = (label: string): string => {
    return locale.value === 'zh' ? styleTagZh(label) : label;
  };

  return { displayLabel };
}
