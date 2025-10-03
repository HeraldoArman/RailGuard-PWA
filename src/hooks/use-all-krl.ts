import { useState, useEffect } from "react";

export interface Gerbong {
  id: string;
  name: string;
  adaKasus: boolean;
  totalPenumpang: number | null;
  statusKepadatan: "longgar" | "sedang" | "padat" | null;
  deskripsi: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KRL {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  gerbong: Gerbong[];
}

interface ApiResponse {
  success: boolean;
  data: KRL[];
  message: string;
}

interface UseAllKrlReturn {
  krlData: KRL[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAllKrl(): UseAllKrlReturn {
  const [krlData, setKrlData] = useState<KRL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKrlData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/krl/all");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch KRL data");
      }

      setKrlData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching KRL data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await fetchKrlData();
  };

  useEffect(() => {
    fetchKrlData();
  }, []);

  return {
    krlData,
    isLoading,
    error,
    refetch,
  };
}