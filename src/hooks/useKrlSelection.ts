// src/hooks/useKrlSelection.ts
import { useState, useEffect } from 'react';

export function useKrlSelection() {
  const [activeKrlId, setActiveKrlId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveKrl = async () => {
    try {
      const response = await fetch('/api/user/krl-selection');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setActiveKrlId(result.activeKrlId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active KRL');
    }
  };

  const selectKrl = async (krlId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/krl-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ krlId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setActiveKrlId(krlId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select KRL';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveKrl();
  }, []);

  return { activeKrlId, selectKrl, isLoading, error, refetch: fetchActiveKrl };
}