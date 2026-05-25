// Single import point for all RTK Query hooks.
// Components should import from here, not from individual slice files.

export { baseApi } from './baseApi'

export {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from './slices/employeeApi'

export {
  useGetAttendanceQuery,
  useGetAttendanceStatsQuery,
  usePunchMutation,
} from './slices/attendanceApi'

export {
  useGetLeavesQuery,
  useGetLeaveBalanceQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
} from './slices/leaveApi'

export {
  useGetPayrollQuery,
  useGetPayrollStatsQuery,
  useUpdatePayrollStatusMutation,
} from './slices/payrollApi'

export {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from './slices/departmentApi'

export {
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from './slices/documentApi'

export {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useAnnounceMutation,
} from './slices/notificationApi'

// Re-export payload/param types for convenience
export type { EmployeeListParams, EmployeeListResponse, CreateEmployeePayload } from './slices/employeeApi'
export type { AttendanceStatsResponse, PunchPayload } from './slices/attendanceApi'
export type { ApplyLeavePayload, UpdateLeaveStatusPayload } from './slices/leaveApi'
export type { PayrollListParams, PayrollStatsResponse } from './slices/payrollApi'
export type { CreateDepartmentPayload, UpdateDepartmentPayload } from './slices/departmentApi'
export type { DocumentListParams, UploadDocumentPayload } from './slices/documentApi'
