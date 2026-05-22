// Role-based access control
export const ROLE_PERMISSIONS = {
  ADMIN: [
    'view_dashboard',
    'manage_employees',
    'manage_attendance',
    'manage_leaves',
    'manage_payroll',
    'manage_departments',
    'manage_users',
    'view_reports',
    'manage_settings',
  ],
  HR_MANAGER: [
    'view_dashboard',
    'manage_employees',
    'manage_attendance',
    'approve_leaves',
    'manage_payroll',
    'manage_departments',
    'view_reports',
  ],
  TEAM_LEAD: [
    'view_dashboard',
    'view_employees',
    'manage_attendance',
    'approve_leaves_team',
    'view_team_reports',
  ],
  EMPLOYEE: [
    'view_dashboard',
    'view_profile',
    'view_attendance',
    'apply_leave',
    'view_payslip',
  ],
};

// Leave types and balances
export const LEAVE_TYPES = {
  SICK: 'Sick Leave',
  CASUAL: 'Casual Leave',
  ANNUAL: 'Annual Leave',
};

export const DEFAULT_LEAVE_BALANCE = {
  SICK: 12,
  CASUAL: 10,
  ANNUAL: 21,
};

// Salary components
export const SALARY_COMPONENTS = {
  BASIC: 'Basic Salary',
  HRA: 'House Rent Allowance',
  DA: 'Dearness Allowance',
  PF: 'Provident Fund',
  IT: 'Income Tax',
  ESI: 'ESI',
};

// Status badges
export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-orange-100 text-orange-800',
  LEAVE: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
};

// Document types
export const DOCUMENT_TYPES = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'];

// API endpoints
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'DD MMM, YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD MMM, YYYY HH:mm';

// Departments
export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Product',
  'Design',
];

// Designations
export const DESIGNATIONS = [
  'Software Engineer',
  'Senior Engineer',
  'Lead Engineer',
  'Engineering Manager',
  'Product Manager',
  'Designer',
  'Marketing Manager',
  'Sales Executive',
  'HR Manager',
  'Finance Manager',
  'Operations Manager',
  'Director',
];

// Mock database storage key
export const MOCK_DB_KEY = 'hrms_mock_db';
export const AUTH_TOKEN_KEY = 'hrms_token';
export const USER_KEY = 'hrms_user';
export const THEME_KEY = 'hrms_theme';

// Notification types
export const NOTIFICATION_TYPES = {
  LEAVE: 'Leave Request',
  PAYROLL: 'Payroll Update',
  ATTENDANCE: 'Attendance Alert',
  SYSTEM: 'System Notification',
  ANNOUNCEMENT: 'Announcement',
};

// API Response messages
export const API_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred. Please try again.',
  LOADING: 'Loading...',
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You do not have permission to access this resource',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Server error. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};
