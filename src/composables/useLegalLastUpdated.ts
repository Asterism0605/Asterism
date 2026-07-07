import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type LegalDocumentKey = 'terms' | 'privacy';

const LEGAL_LAST_UPDATED: Record<LegalDocumentKey, { year: number; month: number; day: number }> = {
  terms: { year: 2026, month: 7, day: 7 },
  privacy: { year: 2026, month: 7, day: 7 }
};

function formatEnglishDate({ year, month, day }: (typeof LEGAL_LAST_UPDATED)[LegalDocumentKey]) {
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function formatTraditionalChineseDate({
  year,
  month,
  day
}: (typeof LEGAL_LAST_UPDATED)[LegalDocumentKey]) {
  return `${year} 年 ${month} 月 ${day} 日`;
}

export function useLegalLastUpdated(documentKey: LegalDocumentKey) {
  const { locale } = useI18n();

  const label = computed(() => (locale.value === 'zh' ? '最後更新日期' : 'Last updated'));
  const date = computed(() => {
    const lastUpdated = LEGAL_LAST_UPDATED[documentKey];
    return locale.value === 'zh'
      ? formatTraditionalChineseDate(lastUpdated)
      : formatEnglishDate(lastUpdated);
  });

  return { label, date };
}
