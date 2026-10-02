import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * Enhanced admin data hook with:
 * - Real-time updates
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Better error handling
 */
export const useAdminDataRealtime = (endpoint: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cache = useRef<Map<string, any>>(new Map());
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!endpoint) {
      setLoading(false);
      return;
    }

    // Check cache first
    if (!forceRefresh && cache.current.has(endpoint)) {
      const cached = cache.current.get(endpoint);
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(endpoint);
      setData(response.data);
      // Cache the response
      cache.current.set(endpoint, response.data);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast.error(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh after edits (debounced)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }
    refreshTimeout.current = setTimeout(() => {
      fetchData(true);
    }, 2000); // Wait 2 seconds for backend to sync
  }, [fetchData]);

  // Optimistic update helper
  const updateOptimistically = useCallback(async (updatedItem: any, updateFn: () => Promise<any>) => {
    const previousData = data;
    
    // Optimistically update local state
    if (Array.isArray(data)) {
      const idx = data.findIndex((item: any) => item.id === updatedItem.id || item._id === updatedItem._id);
      if (idx > -1) {
        const newData = [...data];
        newData[idx] = { ...newData[idx], ...updatedItem };
        setData(newData);
        cache.current.set(endpoint, newData);
      }
    }

    setIsSaving(true);
    try {
      const result = await updateFn();
      scheduleRefresh(); // Schedule a refresh to get latest data from server
      toast.success('Updated successfully');
      return result;
    } catch (err: any) {
      // Revert optimistic update on error
      setData(previousData);
      cache.current.set(endpoint, previousData);
      toast.error(err.response?.data?.message || 'Update failed');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, endpoint, scheduleRefresh]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    isSaving,
    refresh: () => fetchData(true),
    setData,
    updateOptimistically,
  };
};

/**
 * Specialized hooks using the real-time hook
 */
export const useDashboardRealtime = () => useAdminDataRealtime('/admin/dashboard');
export const useProductsRealtime = (query = '') => useAdminDataRealtime(`/admin/products${query}`);
export const useOrdersRealtime = (query = '') => useAdminDataRealtime(`/admin/orders${query}`);
export const useUsersRealtime = (query = '') => useAdminDataRealtime(`/admin/users${query}`);
export const useSettingsRealtime = () => useAdminDataRealtime('/admin/settings');
export const useCollectionsRealtime = () => useAdminDataRealtime('/admin/collections');

// Keep old hooks for backward compatibility
export const useAdminData = (endpoint: string) => useAdminDataRealtime(endpoint);
export const useDashboard = () => useDashboardRealtime();
export const useProducts = (query = '') => useProductsRealtime(query);
export const useOrders = (query = '') => useOrdersRealtime(query);
export const useUsers = (query = '') => useUsersRealtime(query);
export const useContent = (type: string) => useAdminDataRealtime(`/admin/content/${type}`);
export const useSettings = () => useSettingsRealtime();
