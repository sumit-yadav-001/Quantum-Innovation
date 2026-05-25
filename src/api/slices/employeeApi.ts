import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { Employee } from '../../types'

export interface EmployeeListParams {
  search?: string
  department?: string
  status?: string
  page?: number
  limit?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface EmployeeListResponse {
  data: Employee[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

export type CreateEmployeePayload = Omit<Employee, 'id' | 'attendancePercentage' | 'avatar'> & {
  avatar?: string
}

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<EmployeeListResponse, EmployeeListParams>({
      query: (params = {}) => ({
        url: ENDPOINTS.EMPLOYEES,
        params: {
          ...params,
          department: params.department === 'All' ? undefined : params.department,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Employee' as const, id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    getEmployee: build.query<Employee, string>({
      query: (id) => `${ENDPOINTS.EMPLOYEES}/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Employee', id }],
    }),

    createEmployee: build.mutation<Employee, CreateEmployeePayload>({
      query: (body) => ({
        url: ENDPOINTS.EMPLOYEES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Employee', id: 'LIST' },
        { type: 'Department', id: 'LIST' },
      ],
    }),

    updateEmployee: build.mutation<Employee, { id: string; body: Partial<Employee> }>({
      query: ({ id, body }) => ({
        url: `${ENDPOINTS.EMPLOYEES}/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Department', id: 'LIST' },
      ],
    }),

    deleteEmployee: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `${ENDPOINTS.EMPLOYEES}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Department', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi
