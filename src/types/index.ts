export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  avatar: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  attendancePercentage: number;
  avatar: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  totalHours: number;
}

export type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  sick: number;
  casual: number;
  annual: number;
}

export type PayrollStatus = 'PAID' | 'PROCESSING' | 'PENDING';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string; // YYYY-MM format
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidDate: string | null;
}

export interface Department {
  id: string;
  name: string;
  managerId: string | null;
  managerName: string | null;
  employeeCount: number;
  budget: number;
  description: string;
}

export type DocumentCategory = 'CONTRACT' | 'ID_PROOF' | 'PAYROLL' | 'POLICY';

export interface DocumentRecord {
  id: string;
  name: string;
  category: DocumentCategory;
  uploadDate: string;
  size: string; // e.g. "1.2 MB"
  fileType: string; // e.g. "pdf", "docx", "png"
  employeeId?: string; // If associated with a specific employee
  employeeName?: string;
  url: string;
}

export type NotificationType = 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'SYSTEM' | 'ANNOUNCEMENT';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  date: string;
  senderName?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationState {
  items: Notification[];
  unreadCount: number;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Payslip {
  id: string;
  payrollId: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  netSalary: number;
  generatedAt: string;
}

export interface Allowance {
  name: string;
  amount: number;
}

export interface Deduction {
  name: string;
  amount: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  avgAttendance: number;
  pendingLeaves: number;
  totalPayroll: number;
}

export interface AttendanceStats {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
}

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  validation?: any;
  options?: Array<{ label: string; value: string | number }>;
}
