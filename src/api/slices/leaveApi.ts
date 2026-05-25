import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { LeaveRequest, LeaveBalance, LeaveType } from '../../types'

export interface ApplyLeavePayload {
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
}

export interface UpdateLeaveStatusPayload {
  id: string
  status: 'APPROVED' | 'REJECTED'
  rejectionReason?: string
}

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLeaves: build.query<LeaveRequest[], { employeeId?: string; status?: string }>({
      query: (params) => ({ url: ENDPOINTS.LEAVES, params }),
      transformResponse: (raw: unknown) =>
        Array.isArray(raw) ? raw : ((raw as any)?.data ?? []),
      providesTags: [{ type: 'Leave', id: 'LIST' }],
    }),

    getLeaveBalance: build.query<LeaveBalance, string>({
      query: (employeeId) => ENDPOINTS.LEAVE_BALANCES(employeeId),
      providesTags: (_result, _err, employeeId) => [{ type: 'LeaveBalance', id: employeeId }],
    }),

    applyLeave: build.mutation<LeaveRequest, ApplyLeavePayload>({
      query: (body) => ({
        url: ENDPOINTS.LEAVES,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { employeeId }) => [
        { type: 'Leave', id: 'LIST' },
        { type: 'LeaveBalance', id: employeeId },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    updateLeaveStatus: build.mutation<LeaveRequest, UpdateLeaveStatusPayload>({
      query: ({ id, ...body }) => ({
        url: `${ENDPOINTS.LEAVES}/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'Leave', id: 'LIST' },
        { type: 'LeaveBalance', id: 'LIST' },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetLeavesQuery,
  useGetLeaveBalanceQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
} = leaveApi
