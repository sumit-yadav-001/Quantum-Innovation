import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

interface PayrollFilters {
  month?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export const usePayroll = (filters?: PayrollFilters) => {
  return useQuery({
    queryKey: ['payroll', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/payroll?${params.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const usePayrollStats = (month?: string) => {
  return useQuery({
    queryKey: ['payrollStats', month],
    queryFn: async () => {
      const params = month ? `?month=${month}` : '';
      const response = await apiClient.get(`/payroll/stats${params}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useUpdatePayrollStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/payroll/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] });
    },
  });
};
