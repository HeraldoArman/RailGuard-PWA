import { useState, useEffect, useCallback } from 'react';

interface LatestKasusFilters {
  limit?: number;
  status?: string;
  caseType?: string;
  gerbongId?: string;
  since?: string;
  includeResolved?: boolean;
}

interface KasusGerbong {
  id: string;
  name: string;
  totalPenumpang: number | null;
  statusKepadatan: string | null;
  deskripsi: string | null;
}

interface KasusKrl {
  id: string;
  name: string;
}

interface KasusHandler {
  id: string;
  name: string | null;
  email: string;
}

interface LatestKasus {
  id: string;
  name: string;
  description: string | null;
  status: string;
  caseType: string;
  source: string | null;
  occupancyLabel: string | null;
  occupancyValue: number | null;
  reportedAt: Date;
  acknowledgedAt: Date | null;
  arrivedAt: Date | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  deskripsiKasus: string | null;
  images: string | null;
  gerbong: KasusGerbong;
  krl: KasusKrl;
  handler: KasusHandler | null;
}

interface LatestKasusResponse {
  success: boolean;
  data: LatestKasus[];
  count: number;
  filters: LatestKasusFilters;
}

export function useLatestKasus(initialFilters: LatestKasusFilters = {}) {
  const [data, setData] = useState<LatestKasus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LatestKasusFilters>(initialFilters);

  const fetchLatestKasus = useCallback(async (queryFilters?: LatestKasusFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use provided filters or current state filters
      const currentFilters = queryFilters || filters;
      
      // Build query parameters
      const searchParams = new URLSearchParams();
      
      if (currentFilters.limit) {
        searchParams.append('limit', currentFilters.limit.toString());
      }
      if (currentFilters.status) {
        searchParams.append('status', currentFilters.status);
      }
      if (currentFilters.caseType) {
        searchParams.append('caseType', currentFilters.caseType);
      }
      if (currentFilters.gerbongId) {
        searchParams.append('gerbongId', currentFilters.gerbongId);
      }
      if (currentFilters.since) {
        searchParams.append('since', currentFilters.since);
      }
      if (currentFilters.includeResolved !== undefined) {
        searchParams.append('includeResolved', currentFilters.includeResolved.toString());
      }
      
      const response = await fetch(`/api/kasus/latest?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: LatestKasusResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch latest cases');
      }
      
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch latest cases');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: LatestKasusFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    return fetchLatestKasus();
  }, [fetchLatestKasus]);

  const fetchWithFilters = useCallback((newFilters: LatestKasusFilters) => {
    updateFilters(newFilters);
    return fetchLatestKasus(newFilters);
  }, [fetchLatestKasus, updateFilters]);

  // Helper functions for common filters
  const fetchUnresolvedCases = useCallback(() => {
    return fetchWithFilters({ status: 'belum_ditangani' });
  }, [fetchWithFilters]);

  const fetchCrowdnessCases = useCallback(() => {
    return fetchWithFilters({ caseType: 'kepadatan' });
  }, [fetchWithFilters]);

  const fetchCasesByGerbong = useCallback((gerbongId: string) => {
    return fetchWithFilters({ gerbongId });
  }, [fetchWithFilters]);

  const fetchRecentCases = useCallback((hours: number = 24) => {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    return fetchWithFilters({ since: since.toISOString() });
  }, [fetchWithFilters]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    fetchLatestKasus();
  }, [fetchLatestKasus]);

  return {
    data,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    fetchWithFilters,
    // Helper methods
    fetchUnresolvedCases,
    fetchCrowdnessCases,
    fetchCasesByGerbong,
    fetchRecentCases,
  };
}

// Custom hook for real-time cases (polls every 30 seconds)
export function useLatestKasusRealtime(
  initialFilters: LatestKasusFilters = {},
  pollInterval: number = 30000
) {
  const kasusHook = useLatestKasus(initialFilters);
  
  useEffect(() => {
    if (pollInterval <= 0) return;
    
    const interval = setInterval(() => {
      kasusHook.refetch();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [kasusHook.refetch, pollInterval]);
  
  return kasusHook;
}

// Custom hook for unresolved cases only
export function useUnresolvedKasus() {
  return useLatestKasus({ status: 'belum_ditangani', includeResolved: false });
}

// Custom hook for crowdness cases
export function useCrowdnessKasus() {
  return useLatestKasus({ caseType: 'kepadatan' });
}