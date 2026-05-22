import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import type { LeaveRequest } from '../types';

interface LeaveFilters {
  employeeId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const useLeaves = (filters?: LeaveFilters) => {
  return useQuery({
    queryKey: ['leaves', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/leaves?${params.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useLeaveBalance = (employeeId: string) => {
  return useQuery({
    queryKey: ['leaveBalance', employeeId],
    queryFn: async () => {
      const response = await apiClient.get(`/leaves/balances/${employeeId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveRequest>) => apiClient.post('/leaves', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      if (variables.employeeId) {
        queryClient.invalidateQueries({ queryKey: ['leaveBalance', variables.employeeId] });
      }
    },
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/leaves/${id}`, { status: 'APPROVED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/leaves/${id}`, { status: 'REJECTED', rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};
