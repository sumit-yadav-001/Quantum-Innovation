import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { AttendanceRecord } from '../../types'

export interface AttendanceStatsResponse {
  presentPercentage: number
  totalPresents: number
  totalLates: number
  totalLeaves: number
  totalAbsents: number
  dailyStatsTrend: Array<{
    date: string
    present: number
    late: number
    absent: number
  }>
}

export interface PunchPayload {
  employeeId: string
  date: string
  time: string
  action: 'IN' | 'OUT'
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAttendance: build.query<AttendanceRecord[], { date?: string; employeeId?: string }>({
      query: (params) => ({ url: ENDPOINTS.ATTENDANCE, params }),
      transformResponse: (raw: unknown) =>
        Array.isArray(raw) ? raw : ((raw as any)?.data ?? []),
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),

    getAttendanceStats: build.query<AttendanceStatsResponse, { employeeId?: string }>({
      query: (params) => ({ url: ENDPOINTS.ATTENDANCE_STATS, params }),
      providesTags: [{ type: 'AttendanceStats', id: 'STATS' }],
    }),

    punch: build.mutation<AttendanceRecord, PunchPayload>({
      query: (body) => ({
        url: ENDPOINTS.ATTENDANCE_PUNCH,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'AttendanceStats', id: 'STATS' },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAttendanceQuery,
  useGetAttendanceStatsQuery,
  usePunchMutation,
} = attendanceApi
