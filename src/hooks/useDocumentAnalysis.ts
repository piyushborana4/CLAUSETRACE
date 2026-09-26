import { useMemo, useState, useCallback } from 'react';
import { LegalDocument, Finding, ChecklistItem } from '../types';
import { sanitizeSearchQuery } from '../lib/sanitizer';

export interface UseDocumentAnalysisProps {
  document: LegalDocument | null;
}

export function useDocumentAnalysis({ document }: UseDocumentAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'warning' | 'attention' | 'normal'>('ALL');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Memoized Sanitized Search Term
  const sanitizedQuery = useMemo(() => {
    return sanitizeSearchQuery(searchQuery).toLowerCase();
  }, [searchQuery]);

  // Memoized Category counts
  const categoryCounts = useMemo(() => {
    if (!document?.findings) return {};
    const counts: Record<string, number> = {};
    document.findings.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, [document?.findings]);

  // Memoized Filtered Findings
  const filteredFindings = useMemo(() => {
    if (!document?.findings) return [];

    return document.findings.filter((finding) => {
      // Category filter
      if (selectedCategory !== 'ALL' && finding.category !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'ALL' && finding.severity !== severityFilter) {
        return false;
      }
      // Text search
      if (sanitizedQuery) {
        const titleMatch = finding.title.toLowerCase().includes(sanitizedQuery);
        const summaryMatch = finding.summary.toLowerCase().includes(sanitizedQuery);
        const evidenceMatch = finding.evidence.toLowerCase().includes(sanitizedQuery);
        const sectionMatch = finding.section.toLowerCase().includes(sanitizedQuery);
        return titleMatch || summaryMatch || evidenceMatch || sectionMatch;
      }
      return true;
    });
  }, [document?.findings, selectedCategory, severityFilter, sanitizedQuery]);

  // Selected Finding instance
  const activeFinding = useMemo(() => {
    if (!selectedFindingId || !document?.findings) {
      return filteredFindings[0] || null;
    }
    return document.findings.find((f) => f.id === selectedFindingId) || filteredFindings[0] || null;
  }, [selectedFindingId, document?.findings, filteredFindings]);

  // Key stats summary
  const summaryStats = useMemo(() => {
    if (!document) {
      return { total: 0, warnings: 0, attention: 0, supported: 0, ambiguous: 0 };
    }
    const findings = document.findings || [];
    return {
      total: findings.length,
      warnings: findings.filter((f) => f.severity === 'warning').length,
      attention: findings.filter((f) => f.severity === 'attention').length,
      supported: findings.filter((f) => f.status === 'DOCUMENT_SUPPORTED').length,
      ambiguous: findings.filter((f) => f.status === 'AMBIGUOUS').length,
    };
  }, [document]);

  const selectFinding = useCallback((id: string) => {
    setSelectedFindingId(id);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setSeverityFilter('ALL');
  }, []);

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    severityFilter,
    setSeverityFilter,
    selectedFindingId,
    selectFinding,
    activeFinding,
    filteredFindings,
    categoryCounts,
    summaryStats,
    resetFilters,
  };
}
