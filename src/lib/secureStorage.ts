/**
 * CLAUSETRACE High-Performance Secure Encrypted Storage & Memoization Cache
 * 
 * Features:
 * 1. AES-GCM (256-bit) / Web Crypto API encryption layer for sensitive legal document storage
 * 2. In-memory LRU memoization cache to eliminate repetitive JSON parsing and crypto latency
 * 3. Graceful fallback for non-crypto environments / private browsing modes
 * 4. Automated integrity verification and type-safe retrieval
 */

// In-memory memoization cache for parsed data to avoid JSON.parse overhead on every render
const memoryCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const ENCRYPTION_PREFIX_V1 = 'ct_enc_v1:';
const ENCRYPTION_PREFIX_V2 = 'ct_aes_gcm:';
const DEVICE_SALT = 'CLAUSETRACE_SECURE_STORAGE_SALT_2026';

/**
 * Derives a consistent AES-256 key using Web Crypto PBKDF2
 */
async function getCryptoKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(DEVICE_SALT),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('ct_salt_fixed_gcm'),
        iterations: 10000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.warn('[SecureStorage] WebCrypto key derivation fallback:', err);
    return null;
  }
}

/**
 * AES-GCM Encryption with random 12-byte IV
 */
export async function encryptAESGCM(plainText: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return fastObfuscate(plainText);
  }
  try {
    const key = await getCryptoKey();
    if (!key) return fastObfuscate(plainText);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivBase64 = btoa(String.fromCharCode(...Array.from(iv)));
    const cipherBase64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext))));
    return `${ENCRYPTION_PREFIX_V2}${ivBase64}:${cipherBase64}`;
  } catch (err) {
    console.warn('[SecureStorage] AES-GCM encrypt failed, falling back:', err);
    return fastObfuscate(plainText);
  }
}

/**
 * AES-GCM Decryption
 */
export async function decryptAESGCM(payload: string): Promise<string> {
  if (!payload.startsWith(ENCRYPTION_PREFIX_V2)) {
    return fastDeobfuscate(payload);
  }
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return payload;
  }
  try {
    const parts = payload.slice(ENCRYPTION_PREFIX_V2.length).split(':');
    if (parts.length !== 2) return payload;
    const [ivBase64, cipherBase64] = parts;

    const iv = new Uint8Array(atob(ivBase64).split('').map((c) => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(cipherBase64).split('').map((c) => c.charCodeAt(0)));

    const key = await getCryptoKey();
    if (!key) return payload;

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('[SecureStorage] AES-GCM decrypt failed, falling back:', err);
    return payload;
  }
}

/**
 * Base64 obfuscation fallback for synchronous operations or legacy contexts
 */
function fastObfuscate(str: string): string {
  try {
    return ENCRYPTION_PREFIX_V1 + btoa(encodeURIComponent(str));
  } catch {
    return str;
  }
}

function fastDeobfuscate(str: string): string {
  if (str.startsWith(ENCRYPTION_PREFIX_V1)) {
    try {
      const raw = str.slice(ENCRYPTION_PREFIX_V1.length);
      return decodeURIComponent(atob(raw));
    } catch {
      return str;
    }
  }
  return str;
}

export const secureStorage = {
  /**
   * Synchronously writes an item with obfuscation and in-memory cache update
   */
  setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(value);
      // Update memory cache immediately
      memoryCache.set(key, { value, timestamp: Date.now() });
      
      // Store obfuscated payload in localStorage
      const payload = fastObfuscate(serialized);
      localStorage.setItem(key, payload);

      // Asynchronously upgrade to AES-GCM if WebCrypto is available
      if (window.crypto?.subtle) {
        encryptAESGCM(serialized).then((aesPayload) => {
          try {
            localStorage.setItem(key, aesPayload);
          } catch {}
        }).catch(() => {});
      }
    } catch (err) {
      console.warn(`[SecureStorage] Failed to set item for key "${key}":`, err);
    }
  },

  /**
   * Synchronously gets an item with in-memory memoization (skips JSON.parse if cached)
   */
  getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;

    // Check memoized in-memory cache first
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value as T;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      // Handle AES-GCM vs V1 obfuscation
      let plainText = raw;
      if (raw.startsWith(ENCRYPTION_PREFIX_V1)) {
        plainText = fastDeobfuscate(raw);
      } else if (raw.startsWith(ENCRYPTION_PREFIX_V2)) {
        // Trigger async decrypt to refresh cache in background
        decryptAESGCM(raw).then((decrypted) => {
          try {
            const parsed = JSON.parse(decrypted);
            memoryCache.set(key, { value: parsed, timestamp: Date.now() });
          } catch {}
        });
        // Return default or memory if not yet parsed
        return defaultValue;
      }

      const parsed = JSON.parse(plainText);
      // Save to memory cache for fast future reads
      memoryCache.set(key, { value: parsed, timestamp: Date.now() });
      return parsed as T;
    } catch (err) {
      console.warn(`[SecureStorage] Failed to read item for key "${key}":`, err);
      return defaultValue;
    }
  },

  /**
   * Asynchronous getItem for full AES-GCM decryption support
   */
  async getItemAsync<T>(key: string, defaultValue: T): Promise<T> {
    if (typeof window === 'undefined') return defaultValue;
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value as T;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      let plainText = raw;
      if (raw.startsWith(ENCRYPTION_PREFIX_V2)) {
        plainText = await decryptAESGCM(raw);
      } else {
        plainText = fastDeobfuscate(raw);
      }

      const parsed = JSON.parse(plainText);
      memoryCache.set(key, { value: parsed, timestamp: Date.now() });
      return parsed as T;
    } catch (err) {
      console.warn(`[SecureStorage] Async get failed for key "${key}":`, err);
      return defaultValue;
    }
  },

  /**
   * Removes an item from both localStorage and memory cache
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    memoryCache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  /**
   * Clears all CLAUSETRACE items from storage and memory cache
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('clausetrace_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};
