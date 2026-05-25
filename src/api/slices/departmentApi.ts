import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { Department } from '../../types'

export type CreateDepartmentPayload = Pick<Department, 'name' | 'budget' | 'description'>

export interface UpdateDepartmentPayload {
  id: string
  budget?: number
  description?: string
  managerId?: string | null
  managerName?: string | null
}

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDepartments: build.query<Department[], void>({
      query: () => ENDPOINTS.DEPARTMENTS,
      transformResponse: (raw: unknown) =>
        Array.isArray(raw) ? raw : ((raw as any)?.data ?? []),
      providesTags: [{ type: 'Department', id: 'LIST' }],
    }),

    createDepartment: build.mutation<Department, CreateDepartmentPayload>({
      query: (body) => ({
        url: ENDPOINTS.DEPARTMENTS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),

    updateDepartment: build.mutation<Department, UpdateDepartmentPayload>({
      query: ({ id, ...body }) => ({
        url: `${ENDPOINTS.DEPARTMENTS}/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'Department', id: 'LIST' },
        { type: 'Employee', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} = departmentApi
