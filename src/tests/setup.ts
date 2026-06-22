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
