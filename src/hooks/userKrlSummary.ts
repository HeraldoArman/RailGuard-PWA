// src/hooks/useKrlSummary.ts
import { useState, useEffect } from 'react';

interface KrlSummary {
  krlId: string;
  krlName: string;
  totalGerbong: number;
  normalGerbong: number;
  problematicGerbong: number;
}

export function useKrlSummary() {
  const [data, setData] = useState<KrlSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKrlSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/krl/summary');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch KRL summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchKrlSummary();
  }, []);

  return { data, isLoading, error };
}