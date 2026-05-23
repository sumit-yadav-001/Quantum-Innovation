import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';


interface AttendanceFilters {
  date?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const useAttendance = (filters?: AttendanceFilters) => {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/attendance?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

export const useAttendanceStats = (employeeId?: string) => {
  return useQuery({
    queryKey: ['attendanceStats', employeeId],
    queryFn: async () => {
      const params = employeeId ? `?employeeId=${employeeId}` : '';
      const response = await apiClient.get(`/attendance/stats${params}`);
      return response.data;
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => apiClient.post('/attendance/punch', {
      employeeId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      action: 'IN',
    }),
    onSuccess: (_, _employeeId) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => apiClient.post('/attendance/punch', {
      employeeId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      action: 'OUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
    },
  });
};
