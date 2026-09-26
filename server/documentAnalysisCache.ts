/**
 * CLAUSETRACE Document Analysis In-Memory Cache
 * Prevents redundant Gemini calls when re-analyzing documents with identical text or hash.
 */

import crypto from 'crypto';
import { LegalDocument } from '../src/types';

interface CachedDocumentEntry {
  data: Partial<LegalDocument>;
  timestamp: number;
}

const analysisCache = new Map<string, CachedDocumentEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_ENTRIES = 500;

export function computeDocumentHashKey(content: string, title: string = ''): string {
  return crypto
    .createHash('sha256')
    .update(`${title}::${content}`)
    .digest('hex');
}

export function getCachedAnalysis(hashKey: string): Partial<LegalDocument> | null {
  const entry = analysisCache.get(hashKey);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(hashKey);
    return null;
  }

  return entry.data;
}

export function setCachedAnalysis(hashKey: string, data: Partial<LegalDocument>): void {
  // Evict oldest if exceeding max entries
  if (analysisCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }

  analysisCache.set(hashKey, {
    data,
    timestamp: Date.now(),
  });
}

export function clearAnalysisCache(): void {
  analysisCache.clear();
}
