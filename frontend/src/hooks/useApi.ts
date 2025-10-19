import { useCallback, useEffect, useState } from 'react';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from '../services/api';

export const useApi = <T,>(config: AxiosRequestConfig | null) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!config);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!config) return;
    try {
      setLoading(true);
      const response = await apiClient.request<T>(config);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData } as const;
};
