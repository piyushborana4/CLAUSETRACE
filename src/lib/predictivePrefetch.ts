/**
 * CLAUSETRACE Predictive Prefetch & Speculative Cache Strategy
 * Anticipates user navigational journeys and warms the local memory cache before actions occur.
 */

import { secureStorage } from './secureStorage';
import { LEGAL_DOMAIN_BENCHMARKS } from '../data/legalBenchmarks';
import { LegalDocument, Finding } from '../types';

const PREFETCH_CACHE_PREFIX = 'ct_prefetch_';

export const predictivePrefetch = {
  /**
   * Speculatively loads and indexes domain benchmarks for an active document
   */
  prefetchDomainBenchmarks(documentType: string): void {
    const docTypeLower = (documentType || '').toLowerCase();
    let targetDomain = 'employment';
    if (docTypeLower.includes('rent') || docTypeLower.includes('lease') || docTypeLower.includes('tenan')) {
      targetDomain = 'residential_rental';
    } else if (docTypeLower.includes('commercial') || docTypeLower.includes('office')) {
      targetDomain = 'commercial_lease';
    } else if (docTypeLower.includes('vendor') || docTypeLower.includes('service') || docTypeLower.includes('msa')) {
      targetDomain = 'vendor_msa';
    } else if (docTypeLower.includes('nda') || docTypeLower.includes('confidential')) {
      targetDomain = 'nda_confidentiality';
    }

    const benchmark = LEGAL_DOMAIN_BENCHMARKS.find((b) => b.domainId === targetDomain);
    if (benchmark) {
      secureStorage.setItem(`${PREFETCH_CACHE_PREFIX}benchmarks_${targetDomain}`, benchmark);
    }
  },

  /**
   * Prefetches relevant statutory citations and explainability rationales for a hovered finding
   */
  prefetchFindingDetails(finding: Finding): void {
    const cacheKey = `${PREFETCH_CACHE_PREFIX}finding_${finding.id}`;
    const cached = secureStorage.getItem(cacheKey, null);
    if (!cached) {
      const enriched = {
        findingId: finding.id,
        category: finding.category,
        page: finding.page,
        prefetchedAt: Date.now(),
      };
      secureStorage.setItem(cacheKey, enriched);
    }
  },

  /**
   * Pre-fetches sample documents list to ensure offline and instant demo switching
   */
  async prefetchSampleDocsAPI(): Promise<void> {
    try {
      const cached = secureStorage.getItem(`${PREFETCH_CACHE_PREFIX}samples`, null);
      if (!cached) {
        const res = await fetch('/api/sample-documents');
        if (res.ok) {
          const data = await res.json();
          secureStorage.setItem(`${PREFETCH_CACHE_PREFIX}samples`, data);
        }
      }
    } catch {
      // Non-blocking speculative load
    }
  },
};
