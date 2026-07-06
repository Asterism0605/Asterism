import { config } from '@vue/test-utils';
import { i18n } from '@/i18n';

// 讓每個測試 mount 都有 $t（預設 en，字串與既有英文斷言一致）
config.global.plugins.push(i18n);

const createStorageMock = (): Storage => {
  let entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    clear: () => {
      entries = new Map<string, string>();
    },
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
};

const storage = createStorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage,
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: storage,
  writable: true,
});
