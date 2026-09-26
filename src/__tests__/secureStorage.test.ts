import { secureStorage } from '../lib/secureStorage';

describe('SecureStorage & Memoization Layer', () => {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, val: string) => storageMap.set(key, val),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    get length() {
      return storageMap.size;
    },
    key: (i: number) => Array.from(storageMap.keys())[i] || null,
  };

  beforeAll(() => {
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
      crypto: undefined,
    };
    (globalThis as any).localStorage = mockLocalStorage;
  });

  beforeEach(() => {
    storageMap.clear();
    secureStorage.clear();
  });

  it('stores and retrieves serialized objects with obfuscation', () => {
    const testDoc = { id: 'doc-123', title: 'Employment Agreement', pageCount: 5 };
    secureStorage.setItem('test_doc_key', testDoc);

    const retrieved = secureStorage.getItem('test_doc_key', null);
    expect(retrieved).toEqual(testDoc);

    // Verify localStorage has encrypted/prefixed payload
    const rawStorage = localStorage.getItem('test_doc_key');
    expect(rawStorage).toBeDefined();
    expect(rawStorage?.startsWith('ct_enc_v1:')).toBe(true);
  });

  it('returns default value when key does not exist', () => {
    const fallback = { default: true };
    const res = secureStorage.getItem('non_existent_key', fallback);
    expect(res).toEqual(fallback);
  });

  it('removes item from both storage and memory cache', () => {
    secureStorage.setItem('key_to_delete', { status: 'active' });
    expect(secureStorage.getItem('key_to_delete', null)).toBeDefined();

    secureStorage.removeItem('key_to_delete');
    expect(secureStorage.getItem('key_to_delete', null)).toBeNull();
  });
});
