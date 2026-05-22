import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/recent-activity');
      return response.data;
    },
    refetchInterval: 1000 * 60,
  });
};
