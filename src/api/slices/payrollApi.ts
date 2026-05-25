import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { PayrollRecord, PayrollStatus } from '../../types'

export interface PayrollListParams {
  month?: string
  department?: string
}

export interface PayrollStatsResponse {
  totalOutflow: number
  avgSalary: number
  totalDeductions: number
  monthlySpendTrend: Array<{
    month: string
    totalSpend: number
    headcount: number
  }>
}

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPayroll: build.query<PayrollRecord[], PayrollListParams>({
      query: (params) => ({
        url: ENDPOINTS.PAYROLL,
        params: {
          ...params,
          department: params.department === 'All' ? undefined : params.department,
        },
      }),
      transformResponse: (raw: unknown) =>
        Array.isArray(raw) ? raw : ((raw as any)?.data ?? []),
      providesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),

    getPayrollStats: build.query<PayrollStatsResponse, { month: string }>({
      query: (params) => ({ url: ENDPOINTS.PAYROLL_STATS, params }),
      providesTags: [{ type: 'PayrollStats', id: 'STATS' }],
    }),

    updatePayrollStatus: build.mutation<PayrollRecord, { id: string; status: PayrollStatus }>({
      query: ({ id, status }) => ({
        url: `${ENDPOINTS.PAYROLL}/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [
        { type: 'Payroll', id: 'LIST' },
        { type: 'PayrollStats', id: 'STATS' },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPayrollQuery,
  useGetPayrollStatsQuery,
  useUpdatePayrollStatusMutation,
} = payrollApi
