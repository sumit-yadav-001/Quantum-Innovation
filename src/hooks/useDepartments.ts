import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/departments');
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useDepartment = (id?: string) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.put(`/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', id] });
    },
  });
};
