import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// RTK Query base — all API slices extend this via injectEndpoints.
// Using fetchBaseQuery with a token getter keeps auth in one place.
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
  // Tag types used across all injected endpoint slices
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
