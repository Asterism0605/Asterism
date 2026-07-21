import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zh from './locales/zh';

// 語系內容在 locales/en.ts 與 zh.ts。新增頁面 → 兩個檔各補對應 key。
// ponytail: 中英兩語系，不上 lazy-load / 複數規則——ZH/EN 用不到，需要再加。

export type AppLocale = 'en' | 'zh';

const STORAGE_KEY = 'asterism:locale';

// 之後要加語言，補一行在這裡 + 在 messages 加對應語系即可，UI（下拉）不用改。
// label 用該語言自己的寫法（endonym），對母語者最好辨識。
export const SUPPORTED_LOCALES: ReadonlyArray<{ value: AppLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' }
];

const messages = { en, zh };

function initialLocale(): AppLocale {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return saved === 'zh' || saved === 'en' ? saved : 'en';
}

function syncDocumentLanguage(locale: AppLocale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
  }
}

const locale = initialLocale();
syncDocumentLanguage(locale);

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages
});

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  syncDocumentLanguage(locale);
}
