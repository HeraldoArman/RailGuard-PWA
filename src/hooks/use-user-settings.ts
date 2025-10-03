// src/hooks/useUserSettings.ts
import { useState, useEffect } from 'react';

interface UserSettings {
  status: boolean;
  sound: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  isVoiceActive: boolean;
}

export function useUserSettings() {
  const [data, setData] = useState<{ user: User; settings: UserSettings } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/settings');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (settings: UserSettings) => {
    try {
      setError(null);
      
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state
      if (data) {
        setData({
          ...data,
          settings,
          user: { ...data.user, isVoiceActive: settings.sound }
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { data, isLoading, error, updateSettings, refetch: fetchSettings };
}