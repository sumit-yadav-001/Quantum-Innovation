import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'


export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('hrms_token')
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),

  
  tagTypes: [
    'Employee',
    'Attendance',
    'AttendanceStats',
    'Leave',
    'LeaveBalance',
    'Payroll',
    'PayrollStats',
    'Department',
    'Document',
    'Notification',
  ],
  endpoints: () => ({}),
})
