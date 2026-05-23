// All API paths in one place — update here if the backend routes ever change.
// MSW intercepts these same paths in mocks/handlers.ts.

export const ENDPOINTS = {
  LOGIN: '/api/auth/login',

  EMPLOYEES: '/api/employees',

  ATTENDANCE: '/api/attendance',
  ATTENDANCE_STATS: '/api/attendance/stats',
  ATTENDANCE_PUNCH: '/api/attendance/punch',

  LEAVES: '/api/leaves',
  LEAVE_BALANCES: (empId: string) => `/api/leaves/balances/${empId}`,

  PAYROLL: '/api/payroll',
  PAYROLL_STATS: '/api/payroll/stats',

  DEPARTMENTS: '/api/departments',

  DOCUMENTS: '/api/documents',
  DOCUMENTS_UPLOAD: '/api/documents/upload',

  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_ANNOUNCE: '/api/notifications/announce',
}
